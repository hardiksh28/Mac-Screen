// window-watcher: tells Desk Diorama, a few times a second, as one JSON line:
//   "w":     on-screen app windows, front to back (so snow can pile up on their top edges).
//            "f":1 marks windows that belong to the app you're using right now.
//   "front": bundle id of the app in front ("pid": its process id).
//   "dock":  where the Dock's icons are (so snow only sits on the icons), or null.
// Window bounds are readable without Screen Recording permission (titles are never requested).
import Cocoa
import ApplicationServices

setbuf(stdout, nil)
let myPid = Int32(CommandLine.arguments.count > 1 ? Int32(CommandLine.arguments[1]) ?? -1 : -1)
var last = ""
var dockJSON = "null"
var dockCheckedAt = Date.distantPast

func rectJSON(_ x: Double, _ y: Double, _ w: Double, _ h: Double, _ how: String) -> String {
    return "{\"x\":\(Int(x)),\"y\":\(Int(y)),\"w\":\(Int(w)),\"h\":\(Int(h)),\"how\":\"\(how)\"}"
}

// 1) Exact, if the user has given Desk Diorama Accessibility access: the Dock's icon list.
func dockFromAccessibility() -> String? {
    guard AXIsProcessTrusted(),
          let dock = NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.dock").first else { return nil }
    let app = AXUIElementCreateApplication(dock.processIdentifier)
    var kids: CFTypeRef?
    guard AXUIElementCopyAttributeValue(app, kAXChildrenAttribute as CFString, &kids) == .success,
          let list = kids as? [AXUIElement] else { return nil }
    for el in list {
        var role: CFTypeRef?
        AXUIElementCopyAttributeValue(el, kAXRoleAttribute as CFString, &role)
        guard (role as? String) == (kAXListRole as String) else { continue }
        var posRef: CFTypeRef?
        var sizeRef: CFTypeRef?
        guard AXUIElementCopyAttributeValue(el, kAXPositionAttribute as CFString, &posRef) == .success,
              AXUIElementCopyAttributeValue(el, kAXSizeAttribute as CFString, &sizeRef) == .success,
              let pv = posRef, let sv = sizeRef,
              CFGetTypeID(pv) == AXValueGetTypeID(), CFGetTypeID(sv) == AXValueGetTypeID() else { continue }
        var p = CGPoint.zero
        var s = CGSize.zero
        AXValueGetValue(pv as! AXValue, .cgPoint, &p)
        AXValueGetValue(sv as! AXValue, .cgSize, &s)
        if s.width > 40 && s.height > 10 { return rectJSON(Double(p.x), Double(p.y), Double(s.width), Double(s.height), "ax") }
    }
    return nil
}

// 2) A Dock-owned window that is Dock-sized and sits at the bottom of the main screen.
func dockFromWindowList(_ list: [[String: Any]], screen: CGRect) -> String? {
    for w in list {
        guard (w[kCGWindowOwnerName as String] as? String) == "Dock",
              let b = w[kCGWindowBounds as String] as? [String: Any],
              let x = b["X"] as? Double, let y = b["Y"] as? Double,
              let wd = b["Width"] as? Double, let ht = b["Height"] as? Double else { continue }
        if wd > 80 && wd < Double(screen.width) - 40 && ht > 20 && ht < 260 &&
            abs((y + ht) - Double(screen.maxY)) < 12 {
            return rectJSON(x, y, wd, ht, "window")
        }
    }
    return nil
}

// 3) Estimate from the Dock's own settings: icon size and how many icons it shows.
func dockFromSettings(screen: CGRect) -> String {
    guard let d = UserDefaults(suiteName: "com.apple.dock") else { return "null" }
    let orientation = d.string(forKey: "orientation") ?? "bottom"
    if orientation != "bottom" { return "null" }
    var tile = d.double(forKey: "tilesize")
    if tile < 16 { tile = 48 }
    var pinned = Set<String>()
    let apps = d.array(forKey: "persistent-apps") ?? []
    for item in apps {
        if let dict = item as? [String: Any], let td = dict["tile-data"] as? [String: Any],
           let bid = td["bundle-identifier"] as? String { pinned.insert(bid.lowercased()) }
    }
    let others = (d.array(forKey: "persistent-others") ?? []).count
    let showRecents = (d.object(forKey: "show-recents") as? Bool) ?? true
    var unpinnedRunning = 0
    var runningIds = Set<String>()
    for a in NSWorkspace.shared.runningApplications where a.activationPolicy == .regular {
        guard let bid = a.bundleIdentifier?.lowercased() else { continue }
        runningIds.insert(bid)
        if bid != "com.apple.finder" && !pinned.contains(bid) { unpinnedRunning += 1 }
    }
    var recents = 0
    if showRecents {
        for item in d.array(forKey: "recent-apps") ?? [] {
            if let dict = item as? [String: Any], let td = dict["tile-data"] as? [String: Any],
               let bid = (td["bundle-identifier"] as? String)?.lowercased(),
               !pinned.contains(bid), !runningIds.contains(bid) { recents += 1 }
        }
        recents = min(recents, 3)
    }
    let icons = 1 + apps.count + unpinnedRunning + recents + others + 1 // Finder … Trash
    let separators = (unpinnedRunning + recents > 0 ? 1 : 0) + 1
    let width = Double(icons) * tile * 1.08 + Double(separators) * tile * 0.42 + tile * 0.3
    let height = tile * 1.25
    let x = Double(screen.midX) - width / 2
    let y = Double(screen.maxY) - height - 4
    return rectJSON(x, y, width, height, "estimate")
}

func tick() {
    autoreleasepool {
        let opts: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
        guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { return }
        let screen = CGDisplayBounds(CGMainDisplayID())
        let frontApp = NSWorkspace.shared.frontmostApplication
        let frontPid = frontApp?.processIdentifier ?? -1
        let frontId = frontApp?.bundleIdentifier ?? ""

        if Date().timeIntervalSince(dockCheckedAt) > 2 {
            dockCheckedAt = Date()
            dockJSON = dockFromAccessibility() ?? dockFromWindowList(list, screen: screen) ?? dockFromSettings(screen: screen)
        }

        var out: [String] = []
        for w in list {
            guard let layer = w[kCGWindowLayer as String] as? Int, layer == 0 else { continue }
            guard let pid = w[kCGWindowOwnerPID as String] as? Int32, pid != myPid else { continue }
            if let alpha = w[kCGWindowAlpha as String] as? Double, alpha < 0.05 { continue }
            guard let b = w[kCGWindowBounds as String] as? [String: Any],
                  let x = b["X"] as? Double, let y = b["Y"] as? Double,
                  let wd = b["Width"] as? Double, let ht = b["Height"] as? Double,
                  wd >= 120, ht >= 60 else { continue }
            let id = w[kCGWindowNumber as String] as? Int ?? 0
            let f = pid == frontPid ? 1 : 0
            out.append("{\"id\":\(id),\"x\":\(Int(x)),\"y\":\(Int(y)),\"w\":\(Int(wd)),\"h\":\(Int(ht)),\"f\":\(f)}")
        }
        let safeId = frontId.replacingOccurrences(of: "\"", with: "")
        let line = "{\"w\":[" + out.joined(separator: ",") + "],\"front\":\"\(safeId)\",\"pid\":\(frontPid),\"dock\":\(dockJSON)}"
        if line != last {
            print(line)
            last = line
        }
    }
}

// A run loop keeps NSWorkspace's "frontmost app" up to date.
let timer = Timer(timeInterval: 0.15, repeats: true) { _ in tick() }
RunLoop.main.add(timer, forMode: .common)
tick()
RunLoop.main.run()
