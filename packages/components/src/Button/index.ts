import type { App, Plugin } from 'vue'
import _Button from './Button.vue'

type SFCWithInstall<T> = T & Plugin
function withInstall<T>(comp: T) {
  ;(comp as SFCWithInstall<T>).install = (app: App) => {
    const name = (comp as any).name
    // 注册组件
    app.component(name, comp as SFCWithInstall<T>)
  }
  return comp as SFCWithInstall<T>
}
export const Button = withInstall(_Button)
export default Button
