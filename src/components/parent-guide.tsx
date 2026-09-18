import { ShieldCheck, Smartphone, Keyboard, Download, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

export function ParentGuide({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>让小手放心探索</DialogTitle><DialogDescription>开始之前，花一分钟为孩子准备一个音乐小角落。</DialogDescription></DialogHeader>
      <div className="guide-sections">
        <section><ShieldCheck /><div><h3>打开儿童模式</h3><p>普通按键会变成音符，页面内的滚动、右键和选择会被拦截。音量、音色等设置会隐藏。按住右上角的锁 3 秒即可解锁，提前松开就会取消。</p></div></section>
        <section><Smartphone /><div><h3>设备锁定，防误退更稳妥</h3><p>iPad：设置 → 辅助功能 → 引导式访问。打开钢琴后，连按三次顶部按钮（或主屏幕按钮）启动，用家长密码退出。Android 可使用“应用固定”；Windows 可设置 kiosk 专用账户。</p></div></section>
        <Alert><Info /><AlertTitle>网页不能锁住整个设备</AlertTitle><AlertDescription>系统快捷键、浏览器保留按键、退出全屏手势和电源键可能仍然有效。儿童模式用于减少误触；请配合设备的引导式访问或 kiosk 使用。</AlertDescription></Alert>
        <section><Keyboard /><div><h3>键盘、鼠标、小手指，都能弹</h3><p>按琴键下方的字母演奏；多指同时按下可以弹和弦，手指划过琴键可以滑奏。手机竖屏显示一个八度，较宽屏幕显示两个八度。</p></div></section>
        <section><Download /><div><h3>放到主屏幕，随时打开</h3><p>iPad / iPhone：Safari → 分享 → 添加到主屏幕。Chrome 可使用地址栏的安装按钮。首次联网加载并显示“离线已就绪”后，四种音色均可离线弹奏。</p></div></section>
      </div>
      <Separator />
      <p className="guide-footnote">建议先用设备音量键调低音量，再交给孩子。应用不会请求麦克风、摄像头或个人信息。</p>
      <Button size="comfortable" onClick={() => setOpen(false)}>知道了，去弹琴</Button>
    </DialogContent>
  </Dialog>
}
