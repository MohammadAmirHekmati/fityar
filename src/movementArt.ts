// Original educational diagrams / تصویرسازی آموزشی اختصاصی، not photographs.
// Coordinates: head, shoulder, hip, elbow, hand, knee, foot; side view unless stated.
type Pose=[number,number][];
const standing:Pose=[[110,30],[110,58],[110,116],[103,86],[98,108],[106,151],[104,184]];
const poses:Record<string,[Pose,Pose]>={
 jog:[[[110,30],[110,58],[110,116],[137,86],[151,68],[140,149],[163,183]],[[110,30],[110,58],[110,116],[80,80],[96,60],[146,123],[142,161]]],
 'push-wall':[[[122,31],[115,56],[95,114],[143,62],[170,65],[76,150],[60,184]],[[149,33],[141,59],[111,115],[154,92],[170,65],[85,151],[60,184]]],
 'push-incline':[[[157,49],[143,68],[102,108],[148,94],[153,120],[66,145],[28,184]],[[174,93],[159,108],[109,133],[130,99],[153,120],[68,159],[28,184]]],
 'push-knee':[[[55,76],[69,94],[115,132],[65,134],[61,180],[159,174],[198,150]],[[39,134],[58,146],[110,161],[85,155],[61,180],[159,174],[198,150]]],
 'push-regular':[[[48,78],[65,96],[118,128],[63,138],[61,180],[161,151],[205,181]],[[33,139],[55,150],[115,162],[87,158],[61,180],[164,172],[205,181]]],
 'squat-free':[standing,[[125,65],[118,89],[81,131],[148,98],[176,102],[134,145],[120,184]]],
 'squat-chair':[[[125,66],[117,90],[83,132],[139,111],[153,124],[138,139],[139,184]],standing],
 bridge:[[[30,172],[54,174],[115,175],[82,179],[109,181],[153,125],[184,180]],[[30,172],[54,174],[117,130],[82,179],[109,181],[153,125],[184,180]]],
 calf:[standing,[[110,20],[110,48],[110,106],[103,76],[98,98],[106,141],[117,182]]],
 'heel-slide':[[[30,172],[54,174],[115,175],[82,179],[109,181],[153,125],[184,180]],[[30,172],[54,174],[115,175],[82,179],[109,181],[163,177],[209,180]]],
 'bird-dog':[[[49,82],[72,100],[142,100],[72,138],[72,180],[147,178],[190,180]],[[49,82],[72,100],[142,100],[40,102],[15,103],[177,101],[212,103]]],
 march:[standing,[[110,30],[110,58],[110,116],[139,79],[157,58],[142,122],[145,158]]],
 walk:[standing,[[110,30],[110,58],[110,116],[137,86],[151,102],[140,149],[163,183]]],
 'step-touch':[[[110,30],[110,58],[110,116],[88,86],[80,108],[104,151],[104,184]],[[110,30],[110,58],[110,116],[88,86],[80,108],[147,146],[174,184]]],
 'side-leg':[[[110,30],[110,58],[110,116],[80,64],[55,65],[104,151],[104,184]],[[110,30],[110,58],[110,116],[80,64],[55,65],[148,142],[182,164]]],
 'shoulder-roll':[standing,[[110,30],[110,49],[110,116],[105,80],[98,106],[106,151],[104,184]]],
 cooldown:[standing,standing],
};
export const artIds=Object.keys(poses);
export function movementSvg(id:string,frame:number){
 const pair=poses[id];if(!pair)return '';
 const [head,shoulder,hip,elbow,hand,knee,foot]=pair[frame===0?0:1];
 const line=(points:number[][],color:string,width:number)=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const p=(v:number[])=>v.join(',');
 let props='';
 if(id==='push-wall')props='<rect x="176" y="18" width="12" height="171" rx="3" fill="#90a6aa"/>';
 if(id==='push-incline')props='<path d="M145 124H221V189H212V134H145Z" fill="#90a6aa"/>';
 if(id==='squat-chair')props='<path d="M45 91V142H102V188H94V149H53V188H45Z" fill="#90a6aa"/>';
 if(id==='side-leg')props='<rect x="44" y="18" width="10" height="171" rx="3" fill="#90a6aa"/>';
 // A muted rear limb clarifies support; colored clothing distinguishes torso from legs.
 const rear=id==='bird-dog'?line([[72,100],[80,138],[80,180]],'#b68264',11)+line([hip,[147,178],[190,180]],'#66738b',15):id==='heel-slide'?line([hip,[153,125],[184,180]],'#66738b',15):(id==='jog'||id==='march'||id==='walk'||id==='step-touch'||id==='side-leg')?line([hip,[96,150],[85,184]],'#394b65',17):line([hip,[knee[0]+8,knee[1]],[foot[0]+8,foot[1]]],'#66738b',15);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 235 205"><rect width="235" height="205" rx="16" fill="#eef3f0"/><path d="M15 190H222" stroke="#b4c9c5" stroke-width="3"/>${props}${rear}${line([hip,knee,foot],'#263952',19)}${line([shoulder,hip],'#2b9b8b',30)}${line([shoulder,elbow,hand],'#d69c77',12)}${line([shoulder,[shoulder[0]+(elbow[0]-shoulder[0])*.42,shoulder[1]+(elbow[1]-shoulder[1])*.42]],'#238879',17)}${line([head,shoulder],'#d69c77',12)}<circle cx="${head[0]}" cy="${head[1]}" r="14" fill="#e2ad88"/><path d="M${head[0]-13} ${head[1]-2}Q${head[0]-9} ${head[1]-23} ${head[0]+12} ${head[1]-5}" fill="#293748"/><circle cx="${head[0]+7}" cy="${head[1]+1}" r="1.5" fill="#293748"/>${line([foot,[foot[0]+10,foot[1]+1]],'#172838',10)}<circle cx="${hand[0]}" cy="${hand[1]}" r="6" fill="#e2ad88"/>${id==='shoulder-roll'?'<path d="M138 42Q163 58 142 74" fill="none" stroke="#d67c38" stroke-width="3"/><path d="M140 65L142 74L151 72" fill="none" stroke="#d67c38" stroke-width="3"/>':''}<desc>${id} ${frame===0?'start':'end'} ${p(hip)}</desc></svg>`;
}
