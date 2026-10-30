import {create} from 'zustand';
interface UI {project:string|null;page:string;tab:string;quick:boolean;command:boolean;toast:string;set:(v:Partial<Omit<UI,'set'>>)=>void}
export const useUI=create<UI>((set)=>({project:null,page:'projects',tab:'Overview',quick:false,command:false,toast:'',set}));
export function notify(toast:string){useUI.getState().set({toast});setTimeout(()=>useUI.getState().set({toast:''}),4000);}
