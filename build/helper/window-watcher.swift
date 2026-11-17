// window-watcher: prints the on-screen app windows (front to back) as one JSON line, a few times a second.
// Desk Diorama uses it so snow can pile up on top of windows. Window bounds are readable
// without Screen Recording permission (window titles are not requested).
import Cocoa

setbuf(stdout, nil)
let myPid = Int32(CommandLine.arguments.count > 1 ? Int32(CommandLine.arguments[1]) ?? -1 : -1)
var last = ""

while true {
    autoreleasepool {
        let opts: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
        guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { return }
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
            out.append("{\"id\":\(id),\"x\":\(Int(x)),\"y\":\(Int(y)),\"w\":\(Int(wd)),\"h\":\(Int(ht))}")
        }
        let line = "[" + out.joined(separator: ",") + "]"
        if line != last {
            print(line)
            last = line
        }
    }
    usleep(150_000)
}
