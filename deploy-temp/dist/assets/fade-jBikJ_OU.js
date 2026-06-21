import{Z as e}from"./jsx-runtime-Dn0i4tYK.js";import{M as t}from"./tooltip-B1U4rk7S.js";var n=new e(`antFadeIn`,{"0%":{opacity:0},"100%":{opacity:1}}),r=new e(`antFadeOut`,{"0%":{opacity:1},"100%":{opacity:0}}),i=(e,i=!1)=>{let{antCls:a}=e,o=`${a}-fade`,s=i?`&`:``;return[t(o,n,r,e.motionDurationMid,i),{[`
        ${s}${o}-enter,
        ${s}${o}-appear
      `]:{opacity:0,animationTimingFunction:`linear`},[`${s}${o}-leave`]:{animationTimingFunction:`linear`}}]};export{i as t};