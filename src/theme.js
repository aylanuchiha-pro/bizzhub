export const CSS = dark => `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:'Instrument Sans',system-ui,sans-serif;font-size:14px;line-height:1.5}
:root{
--bg:${dark ? "#0d0d14" : "#f1f4f9"};
--w:${dark ? "#16161f" : "#ffffff"};
--surf:${dark ? "#1d1d2a" : "#f8f9fc"};
--brd:${dark ? "#252538" : "#e4e9f2"};
--txt:${dark ? "#e8e6ff" : "#0d1117"};
--sub:${dark ? "#8b89b0" : "#4b5563"};
--mut:${dark ? "#565474" : "#9ca3af"};
--ac:#4f46e5;--acb:${dark ? "rgba(79,70,229,.18)" : "#eef2ff"};
--ok:#16a34a;--err:#dc2626;--warn:#d97706;
--sdbar:${dark ? "#111118" : "#ffffff"};
--sh:${dark ? "0 1px 3px rgba(0,0,0,.5)" : "0 1px 3px rgba(0,0,0,.06)"};
}
body{background:var(--bg);color:var(--txt)}
input,select,textarea{width:100%;background:var(--surf);border:1px solid var(--brd);color:var(--txt);border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(79,70,229,.12)}
input::placeholder,textarea::placeholder{color:var(--mut)}
select option{background:var(--w)}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--brd);border-radius:4px}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=date]::-webkit-calendar-picker-indicator{filter:${dark ? "invert(.8)" : "none"}}
@media(max-width:760px){
.sb{display:none!important}
.pg{padding:12px 14px 24px!important}
.kpis{flex-direction:column!important}
.cg2,.cg3{grid-template-columns:1fr!important}
.fg2,.fg3{grid-template-columns:1fr!important}
.tbl-wrap{overflow-x:auto}
.mhide{display:none!important}
.mshow{display:flex!important}
.m-only{display:flex!important;flex-direction:column;gap:12px}
}
@media(min-width:761px){
.mshow{display:none!important}
.m-only{display:none!important}
}
`;
