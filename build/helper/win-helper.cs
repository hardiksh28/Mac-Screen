// win-helper: the Windows side of Desk Diorama.
//
//   win-helper.exe <our-pid>              watch mode: prints one JSON line whenever something changes
//       "w":     visible app windows, front to back (snow piles up on their top edges); "f":1 = app in front
//       "front": exe name of the app in front ("desktop" when you're on the desktop), "pid": its process id
//       "dock":  where the taskbar's app icons are (snow sits on them), or null
//   win-helper.exe attach <hwnd> <x> <y> <w> <h>   puts our wallpaper window behind the desktop icons
//
// All coordinates are physical pixels (the process is per-monitor DPI aware); the app converts them.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
#if UIA
using System.Windows.Automation;
#endif

static class Native
{
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int idx);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder sb, int max);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowTextLength(IntPtr h);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string title);
    [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr h, uint msg, IntPtr w, IntPtr l, uint flags, uint timeout, out IntPtr result);
    [DllImport("user32.dll")] public static extern IntPtr SetParent(IntPtr child, IntPtr parent);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool ScreenToClient(IntPtr h, ref POINT p);
    [DllImport("user32.dll")] public static extern IntPtr SetProcessDpiAwarenessContext(IntPtr v);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int attr, out RECT r, int size);
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int attr, out int v, int size);
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }

    public const int GWL_STYLE = -16, GWL_EXSTYLE = -20;
    public const int WS_EX_TOOLWINDOW = 0x80, WS_EX_NOACTIVATE = 0x08000000;
    public const int WS_CHILD = 0x40000000;
    public const int DWMWA_EXTENDED_FRAME_BOUNDS = 9, DWMWA_CLOAKED = 14;
    public const uint SWP_NOACTIVATE = 0x10, SWP_SHOWWINDOW = 0x40, SWP_NOSIZE = 0x1, SWP_NOMOVE = 0x2;

    public static string ClassOf(IntPtr h)
    {
        var sb = new StringBuilder(256);
        GetClassName(h, sb, sb.Capacity);
        return sb.ToString();
    }
    public static RECT Bounds(IntPtr h)
    {
        RECT r;
        if (DwmGetWindowAttribute(h, DWMWA_EXTENDED_FRAME_BOUNDS, out r, Marshal.SizeOf(typeof(RECT))) != 0) GetWindowRect(h, out r);
        return r;
    }
    public static bool Cloaked(IntPtr h)
    {
        int v;
        return DwmGetWindowAttribute(h, DWMWA_CLOAKED, out v, 4) == 0 && v != 0;
    }
}

static class Program
{
    static readonly HashSet<string> ShellClasses = new HashSet<string> {
        "Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd", "NotifyIconOverflowWindow",
        "Windows.UI.Core.CoreWindow", "XamlExplorerHostIslandWindow", "TopLevelWindowForOverflowXamlIsland"
    };
    static readonly Dictionary<uint, string> NameCache = new Dictionary<uint, string>();

    static string ProcName(uint pid)
    {
        string n;
        if (NameCache.TryGetValue(pid, out n)) return n;
        try { n = Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); } catch { n = ""; }
        NameCache[pid] = n;
        return n;
    }

    static int Main(string[] args)
    {
        try { Native.SetProcessDpiAwarenessContext(new IntPtr(-4)); } catch { try { Native.SetProcessDPIAware(); } catch { } }
        if (args.Length >= 6 && args[0] == "attach") return Attach(args);
        uint myPid = 0;
        if (args.Length > 0) uint.TryParse(args[0], out myPid);
        Watch(myPid);
        return 0;
    }

    /* ---------------- wallpaper behind the desktop icons ---------------- */
    static int Attach(string[] a)
    {
        IntPtr hwnd = new IntPtr(long.Parse(a[1]));
        int x = int.Parse(a[2]), y = int.Parse(a[3]), w = int.Parse(a[4]), h = int.Parse(a[5]);
        IntPtr progman = Native.FindWindow("Progman", null);
        if (progman == IntPtr.Zero) { Console.WriteLine("{\"ok\":false,\"why\":\"no Progman\"}"); return 1; }
        IntPtr res;
        // ask Explorer to split the desktop into "icons" and "wallpaper" layers
        Native.SendMessageTimeout(progman, 0x052C, new IntPtr(0xD), new IntPtr(0x1), 0, 1000, out res);
        Native.SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out res);
        Thread.Sleep(150);

        // Windows 11 24H2+: the wallpaper layer is a WorkerW *inside* Progman, under the icons view
        IntPtr innerWorker = Native.FindWindowEx(progman, IntPtr.Zero, "WorkerW", null);
        IntPtr defView = Native.FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);
        if (innerWorker != IntPtr.Zero && defView != IntPtr.Zero)
        {
            Native.SetParent(hwnd, progman);
            Place(hwnd, progman, defView, x, y, w, h);
            Console.WriteLine("{\"ok\":true,\"how\":\"progman\"}");
            return 0;
        }
        // older Windows: the icons live in a WorkerW; the empty WorkerW right after it is the wallpaper layer
        IntPtr target = IntPtr.Zero;
        Native.EnumWindows((top, l) =>
        {
            IntPtr dv = Native.FindWindowEx(top, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (dv != IntPtr.Zero) target = Native.FindWindowEx(IntPtr.Zero, top, "WorkerW", null);
            return true;
        }, IntPtr.Zero);
        if (target == IntPtr.Zero) { Console.WriteLine("{\"ok\":false,\"why\":\"no WorkerW\"}"); return 1; }
        Native.SetParent(hwnd, target);
        Place(hwnd, target, IntPtr.Zero, x, y, w, h);
        Console.WriteLine("{\"ok\":true,\"how\":\"workerw\"}");
        return 0;
    }
    static void Place(IntPtr hwnd, IntPtr parent, IntPtr below, int x, int y, int w, int h)
    {
        var p = new Native.POINT { X = x, Y = y };
        Native.ScreenToClient(parent, ref p); // screen → the parent's own coordinates
        uint flags = Native.SWP_NOACTIVATE | Native.SWP_SHOWWINDOW;
        Native.SetWindowPos(hwnd, below, p.X, p.Y, w, h, flags);
    }

    /* ---------------- watch mode ---------------- */
    static void Watch(uint myPid)
    {
        string last = "";
        string dock = "null";
        DateTime dockAt = DateTime.MinValue;
        var stdout = Console.Out;
        while (true)
        {
            try
            {
                IntPtr fg = Native.GetForegroundWindow();
                uint fgPid;
                Native.GetWindowThreadProcessId(fg, out fgPid);
                string fgClass = Native.ClassOf(fg);
                string front = ShellClasses.Contains(fgClass) || fg == IntPtr.Zero ? "desktop" : ProcName(fgPid);
                if (front == "explorer" && fgClass == "CabinetWClass") front = "explorer";

                var wins = new List<string>();
                Native.EnumWindows((h, l) =>
                {
                    if (!Native.IsWindowVisible(h) || Native.IsIconic(h) || Native.Cloaked(h)) return true;
                    int ex = Native.GetWindowLong(h, Native.GWL_EXSTYLE);
                    if ((ex & Native.WS_EX_TOOLWINDOW) != 0) return true;
                    string cls = Native.ClassOf(h);
                    if (ShellClasses.Contains(cls)) return true;
                    if (Native.GetWindowTextLength(h) == 0) return true;
                    uint pid;
                    Native.GetWindowThreadProcessId(h, out pid);
                    if (pid == myPid) return true;
                    var r = Native.Bounds(h);
                    int w = r.Right - r.Left, ht = r.Bottom - r.Top;
                    if (w < 120 || ht < 60) return true;
                    wins.Add("{\"id\":" + h.ToInt64() + ",\"x\":" + r.Left + ",\"y\":" + r.Top + ",\"w\":" + w + ",\"h\":" + ht + ",\"f\":" + (pid == fgPid ? 1 : 0) + "}");
                    return true;
                }, IntPtr.Zero);

                if ((DateTime.Now - dockAt).TotalSeconds > 2)
                {
                    dockAt = DateTime.Now;
                    dock = TaskbarIcons();
                }
                string line = "{\"w\":[" + string.Join(",", wins.ToArray()) + "],\"front\":\"" + front.Replace("\"", "") + "\",\"pid\":" + fgPid + ",\"dock\":" + dock + "}";
                if (line != last)
                {
                    stdout.WriteLine(line);
                    stdout.Flush();
                    last = line;
                }
            }
            catch (System.IO.IOException) { return; } // the app went away
            catch { }
            Thread.Sleep(150);
        }
    }

    static string RectJson(int x, int y, int w, int h, string how)
    {
        return "{\"x\":" + x + ",\"y\":" + y + ",\"w\":" + w + ",\"h\":" + h + ",\"how\":\"" + how + "\"}";
    }

    // Where the app icons on the taskbar are. Only for a taskbar along the bottom of the screen.
    static string TaskbarIcons()
    {
        IntPtr tray = Native.FindWindow("Shell_TrayWnd", null);
        if (tray == IntPtr.Zero) return "null";
        Native.RECT tb;
        Native.GetWindowRect(tray, out tb);
        int tbW = tb.Right - tb.Left, tbH = tb.Bottom - tb.Top;
        if (tbW < tbH) return "null"; // taskbar on the side
        // Windows 10: the classic task list window
        IntPtr rebar = Native.FindWindowEx(tray, IntPtr.Zero, "ReBarWindow32", null);
        IntPtr sw = rebar != IntPtr.Zero ? Native.FindWindowEx(rebar, IntPtr.Zero, "MSTaskSwWClass", null) : IntPtr.Zero;
        IntPtr list = sw != IntPtr.Zero ? Native.FindWindowEx(sw, IntPtr.Zero, "MSTaskListWClass", null) : IntPtr.Zero;
        if (list != IntPtr.Zero)
        {
            Native.RECT r;
            Native.GetWindowRect(list, out r);
            if (r.Right - r.Left > 40) return RectJson(r.Left, tb.Top, r.Right - r.Left, tbH, "tasklist");
        }
#if UIA
        // Windows 11: ask UI Automation for the taskbar's buttons (left of the system tray)
        try
        {
            var root = AutomationElement.FromHandle(tray);
            IntPtr notify = Native.FindWindowEx(tray, IntPtr.Zero, "TrayNotifyWnd", null);
            int stop = tb.Right;
            if (notify != IntPtr.Zero) { Native.RECT nr; Native.GetWindowRect(notify, out nr); stop = nr.Left; }
            var buttons = root.FindAll(TreeScope.Descendants, new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button));
            double x0 = double.MaxValue, x1 = double.MinValue;
            foreach (AutomationElement b in buttons)
            {
                var br = b.Current.BoundingRectangle;
                if (br.IsEmpty || br.Width < 8 || br.Right > stop + 2) continue;
                x0 = Math.Min(x0, br.Left);
                x1 = Math.Max(x1, br.Right);
            }
            if (x1 > x0) return RectJson((int)x0, tb.Top, (int)(x1 - x0), tbH, "uia");
        }
        catch { }
#endif
        // fallback: the whole taskbar
        return RectJson(tb.Left, tb.Top, tbW, tbH, "taskbar");
    }
}
