import { MainModule } from './types'

// This is work in progress.
// It will be useful for the LSP

// Currently probably broken.
declare global {
    export interface Window {
        LhasaModule: MainModule;
    }
}