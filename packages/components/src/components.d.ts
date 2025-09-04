import * as components from './index'
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    EasyButton: typeof components.Button
  }
}
export {}
