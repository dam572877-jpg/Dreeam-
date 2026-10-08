/* DREAM HOUSE — clear corporate PDF renderer */
(function(){
  'use strict';
  const A4W=1654,A4H=2339,M=72;
  const C={navy:'#04061C',slate:'#0C0A2B',plum:'#2C2B52',border:'#D8DEE9',graphite:'#202333',muted:'#657087',blue:'#0067FF',violet:'#665EFF',coral:'#FF3A63',soft:'#F6F8FC',softV:'#F1F0FF',softB:'#EEF4FF',softN:'#EEF0F7',white:'#FFFFFF',ink:'#151A35'};
  const money=n=>new Intl.NumberFormat('ar-EG').format(Number(n||0))+' ج.م';
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const has=v=>{const s=clean(v);return s!==''&&s!=='—'&&s!=='undefined'&&s!=='null'};
  const hasNonZero=v=>has(v)&&!/^0(?:\.0+)?$/.test(clean(v));
  function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function wrap(ctx,text,maxWidth,font){text=clean(text);if(!text)return [''];ctx.font=font;const words=text.split(' '),lines=[];let line='';for(const word of words){const t=line?line+' '+word:word;if(ctx.measureText(t).width<=maxWidth)line=t;else{if(line)lines.push(line);line=word}}if(line)lines.push(line);return lines.length?lines:[''];}
  function rtl(ctx,text,x,y,w,size,color,weight='500',maxLines=2){ctx.font=`${weight} ${size}px Cairo, Arial, sans-serif`;ctx.fillStyle=color;ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';const lines=wrap(ctx,text,w,ctx.font).slice(0,maxLines);const lh=Math.round(size*1.45);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lh));return lines.length*lh;}
  function ltr(ctx,text,x,y,size,color,weight='500'){ctx.font=`${weight} ${size}px Inter, Arial, sans-serif`;ctx.fillStyle=color;ctx.direction='ltr';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(clean(text),x,y);}
  function groupOf(x){if(x?.category==='أراضي'||String(x?.type||'').includes('أرض')||x?.type==='أسهم')return 'أراضي';if(['شقة','فيلا'].includes(x?.type))return 'شقق';if(['عمارة','برج','بيت','بيت مشاركة'].includes(x?.type))return 'عمارات';return 'أخرى';}
  function derived(x){
    const d=clean(x?.desc),o={...x};
    const first=re=>{const m=d.match(re);return m?clean(m[1]):''};
    if(!has(o.elevator))o.elevator=/أسانسير\s*(?:شغال|موجود|يوجد)/i.test(d)?'يوجد':/بدون أسانسير|لا يوجد أسانسير/i.test(d)?'لا يوجد':'';
    if(!has(o.buildingElevator))o.buildingElevator=/أسانسير\s*(?:شغال|موجود|يوجد)/i.test(d)?'يوجد':'';
    if(!hasNonZero(o.rooms)){const m=d.match(/(\d+)\s*(?:غرف|غرفة|غرف نوم)/);if(m)o.rooms=m[1]}
    if(!hasNonZero(o.baths)){const m=d.match(/(\d+)\s*(?:حمام|حمامات)/);if(m)o.baths=m[1]}
    if(!has(o.reception)){const m=d.match(/ريسبشن\s*([^،|.]+)/);if(m)o.reception=clean(m[1])}
    if(!has(o.kitchen)&&/مطبخ/i.test(d))o.kitchen=first(/(مطبخ[^،|.]*)/i)||'مذكور في التفاصيل';
    if(!has(o.floor)&&/الدور/i.test(d))o.floor=first(/الدور\s*([^،|.]+)/i);
    if(!has(o.building)&&/برج|عمارة/i.test(d))o.building=first(/((?:برج|عمارة)\s*[^،|.]*)/i);
    if(!has(o.floors)){const m=d.match(/(\d+(?:\s*\+\s*\d+)?\s*(?:أدوار|ادوار|دور))/i);if(m)o.floors=clean(m[1])}
    if(!has(o.shops)){const m=d.match(/(\d+)\s*محلات?/i);if(m)o.shops=m[1]}
    if(!has(o.meters)&&/عدادات?/i.test(d))o.meters=first(/(كامل\s+العدادات|بكامل\s+العدادات|عدادات?[^،|.]*)/i)||'مذكورة في التفاصيل';
    if(!has(o.buildingLicense))o.buildingLicense=first(/(مرخص(?:ة|ه)?[^|]*)/i);
    if(!has(o.license))o.license=first(/(مرخص(?:ة|ه)?[^|]*)/i);
    if(!has(o.buildingFacade))o.buildingFacade=first(/(واجه[هة][^|]*)/i);
    if(!has(o.facade))o.facade=first(/(واجه[هة][^|]*)/i);
    if(!has(o.buildingCorner)&&/ناصي[هة]/i.test(d))o.buildingCorner='نعم';
    if(!has(o.corner)&&/ناصي[هة]/i.test(d))o.corner='نعم';
    if(!has(o.roof)&&/روف/i.test(d))o.roof='يوجد روف / ملحق';
    if(!has(o.finish)&&/سوبر لوكس|ألترا|تشطيب/i.test(d))o.finish=first(/((?:ألترا\s+)?(?:سوبر لوكس|تشطيب)[^،|.]*)/i)||'مذكور في التفاصيل';
    return o;
  }
  const labelMap={area:'المنطقة',purpose:'الغرض',status:'الحالة',owner:'المالك',phone:'الهاتف',floor:'الدور',building:'البرج / العمارة',elevator:'الأسانسير',rooms:'الغرف',baths:'الحمامات',kitchen:'المطبخ',reception:'تقسيمة الريسبشن',finish:'التشطيب',apartmentLegal:'الرخصة / القانونية',floors:'عدد الأدوار',buildingElevator:'الأسانسير',shops:'عدد المحلات',meters:'العدادات',buildingLicense:'الرخصة / الترخيص',buildingLegal:'الصلاحية / القانونية',buildingFacade:'الواجهة',buildingCorner:'ناصية',roof:'الروف / الملحق',license:'الرخصة / الترخيص',legal:'الصلاحية / القانونية',facade:'الواجهة',corner:'ناصية',landUse:'نوع الأرض',landLocation:'موقع الأرض'};
  const ignored=new Set(['id','category','source','created_at','updated_at','createdBy','price','size','priceText','sizeText','title','type','desc','image_url','images']);
  function fields(x){
    x=derived(x);const g=groupOf(x),out=[];
    const push=(k,v,label=labelMap[k])=>{if(has(v))out.push([label||k,String(v)]);};
    push('area',x.area);push('purpose',x.purpose);push('status',x.status);push('owner',x.owner);push('phone',x.phone);
    if(g==='أراضي'){push('license',x.license);push('legal',x.legal);push('facade',x.facade);push('corner',x.corner);push('landUse',x.landUse);push('landLocation',x.landLocation);}
    else if(g==='شقق'){push('floor',x.floor);push('building',x.building);push('elevator',x.elevator);if(hasNonZero(x.rooms))push('rooms',`${x.rooms} غرف`);if(hasNonZero(x.baths))push('baths',`${x.baths} حمام`);push('kitchen',x.kitchen);push('reception',x.reception);push('finish',x.finish);push('apartmentLegal',x.apartmentLegal);}
    else if(g==='عمارات'){push('floors',x.floors||x.floor);push('buildingElevator',x.buildingElevator);push('shops',x.shops);push('meters',x.meters);push('buildingLicense',x.buildingLicense);push('buildingLegal',x.buildingLegal);push('buildingFacade',x.buildingFacade);push('buildingCorner',x.buildingCorner);push('roof',x.roof);}
    for(const [k,v] of Object.entries(x)){if(ignored.has(k)||k in labelMap||!has(v)||typeof v==='object')continue;push(k,v,k)}
    return out;
  }
  const palette={أراضي:{accent:C.blue,soft:C.softB,badge:'أرض'},شقق:{accent:C.violet,soft:C.softV,badge:'شقة'},عمارات:{accent:C.navy,soft:C.softN,badge:'عمارة'},أخرى:{accent:C.plum,soft:'#F1F2F5',badge:'عقار'}};
  function drawField(ctx,f,x,y,w,h){ctx.fillStyle='#F8F9FC';roundRect(ctx,x,y,w,h,13);ctx.fill();rtl(ctx,f[0],x+w-14,y+9,w-28,12,C.muted,'700',1);rtl(ctx,f[1],x+w-14,y+30,w-28,15,C.graphite,'700',2);}
  function drawCard(ctx,raw,y,cardH){
    const x=derived(raw),g=groupOf(x),pal=palette[g]||palette.أخرى,cardX=M,cardW=A4W-2*M;
    ctx.save();ctx.shadowColor='rgba(4,6,28,.10)';ctx.shadowBlur=20;ctx.shadowOffsetY=6;ctx.fillStyle=C.white;roundRect(ctx,cardX,y,cardW,cardH,26);ctx.fill();ctx.restore();ctx.strokeStyle=C.border;ctx.lineWidth=2;roundRect(ctx,cardX,y,cardW,cardH,26);ctx.stroke();ctx.fillStyle=pal.accent;roundRect(ctx,cardX,y,9,cardH,5);ctx.fill();
    ctx.fillStyle=pal.soft;roundRect(ctx,A4W-M-160,y+24,116,42,12);ctx.fill();rtl(ctx,pal.badge,A4W-M-30,y+32,86,14,pal.accent,'800',1);
    rtl(ctx,x.title||'عقار',A4W-M-190,y+22,cardW-225,27,C.ink,'800',2);rtl(ctx,`${x.area||'—'}  ·  ${x.type||'—'}  ·  ${x.purpose||'—'}`,A4W-M-30,y+74,cardW-60,12,C.muted,'600',1);
    const infoY=y+108,infoH=74,infoW=(cardW-48)/2;ctx.fillStyle=pal.soft;roundRect(ctx,M+18,infoY,infoW,infoH,15);ctx.fill();roundRect(ctx,M+30+infoW,infoY,infoW,infoH,15);ctx.fill();
    rtl(ctx,'السعر',M+18+infoW-18,infoY+10,150,11,C.muted,'700',1);rtl(ctx,x.priceText||money(x.price),M+18+infoW-18,infoY+31,infoW-30,21,C.ink,'800',2);
    rtl(ctx,'المساحة',M+30+infoW+infoW-18,infoY+10,150,11,C.muted,'700',1);rtl(ctx,x.sizeText||((has(x.size)?x.size:'')+' م²'),M+30+infoW+infoW-18,infoY+31,infoW-30,20,C.ink,'800',2);
    const fs=fields(x),gx=M+18,gy=infoY+92,cols=3,gap=12,boxW=(cardW-36-gap*2)/3,boxH=62,rowGap=10;const maxBoxes=12;fs.slice(0,maxBoxes).forEach((f,j)=>{const col=j%cols,row=Math.floor(j/cols);drawField(ctx,f,gx+col*(boxW+gap),gy+row*(boxH+rowGap),boxW,boxH)});
    const rows=Math.ceil(Math.min(fs.length,maxBoxes)/cols),detailY=gy+rows*(boxH+rowGap)+16,detailH=Math.max(130,y+cardH-detailY-20);
    ctx.fillStyle='#FBFCFE';roundRect(ctx,M+18,detailY,cardW-36,detailH,15);ctx.fill();rtl(ctx,'التفاصيل الكاملة',A4W-M-34,detailY+12,cardW-70,13,C.ink,'800',1);
    const detail=has(x.desc)?x.desc:'لا توجد تفاصيل إضافية';const lines=Math.max(4,Math.min(9,Math.floor((detailH-42)/20)));rtl(ctx,detail,A4W-M-34,detailY+38,cardW-70,14,C.graphite,'500',lines);
    if(fs.length>maxBoxes)rtl(ctx,`+ ${fs.length-maxBoxes} بيانات إضافية — موجودة في التفاصيل الأصلية`,A4W-M-34,detailY+detailH-23,cardW-70,10,C.muted,'600',1);
  }
  function drawPage(kind,items,pageNo,totalPages){
    const c=document.createElement('canvas');c.width=A4W;c.height=A4H;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.fillStyle='#F5F7FB';ctx.fillRect(0,0,A4W,A4H);
    ctx.fillStyle=C.navy;ctx.fillRect(0,0,A4W,190);ctx.fillStyle=C.violet;ctx.fillRect(0,0,A4W,7);ctx.fillStyle=C.blue;ctx.fillRect(M,166,110,4);
    ltr(ctx,'DREAM HOUSE',M,30,36,C.white,'800');ltr(ctx,'Engineer Ahmed Galal  ·  01035032020',M,82,15,'#B4B4BB','600');
    rtl(ctx,kind==='clients'?'تقرير العملاء والطلبات':'سجل العقارات',A4W-M,29,33,C.white,'800',1);rtl(ctx,`الفيوم  ·  ${new Date().toLocaleDateString('ar-EG')}  ·  ${items.length} سجل`,A4W-M,82,15,'#B4B4BB','600',1);rtl(ctx,'بيانات واضحة قابلة للمشاركة مع العميل',A4W-M,119,12,'#A8A9B8','600',1);
    if(kind==='clients'){
      const y=220,w=A4W-2*M,h=A4H-305;ctx.fillStyle=C.white;roundRect(ctx,M,y,w,h,25);ctx.fill();ctx.strokeStyle=C.border;ctx.lineWidth=2;ctx.stroke();
      items.forEach((x,i)=>{const yy=y+25+i*300; if(yy+270>y+h) return;rtl(ctx,x.name||'عميل',A4W-M-30,yy,600,23,C.ink,'800',1);const fs=[['الهاتف',x.phone],['الطلب',x.type],['الميزانية',money(x.budget)],['المنطقة',x.area||'كل الفيوم'],['الحالة',x.status],['ملاحظات',x.notes||'لا توجد ملاحظات']].filter(f=>has(f[1]));fs.forEach((f,j)=>drawField(ctx,f,M+30+(j%3)*((w-78)/3+9),yy+48+Math.floor(j/3)*82,(w-78)/3,68));ctx.strokeStyle=C.border;ctx.beginPath();ctx.moveTo(M+30,yy+270);ctx.lineTo(A4W-M-30,yy+270);ctx.stroke()});
    }else{
      const gap=24,top=218,bottom=70,cardH=Math.floor((A4H-top-bottom-gap)/2);items.slice(0,2).forEach((x,i)=>drawCard(ctx,x,top+i*(cardH+gap),cardH));
    }
    const fy=A4H-44;ctx.strokeStyle='#D8DEE9';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,fy);ctx.lineTo(A4W-M,fy);ctx.stroke();ltr(ctx,'DREAM HOUSE  ·  Engineer Ahmed Galal  ·  01035032020',M,fy+10,12,C.muted,'600');ltr(ctx,`PAGE ${pageNo} / ${totalPages}`,A4W-M-160,fy+10,12,C.muted,'700');return c;
  }
  function ascii(s){return new TextEncoder().encode(s)}
  function addPdf(jpegs){
    const objects=[],add=p=>{objects.push(p);return objects.length},catalog=add([]),pages=add([]),pageRefs=[];
    jpegs.forEach((data,i)=>{const b64=data.split(',')[1],bin=atob(b64),bytes=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)bytes[j]=bin.charCodeAt(j);const img=add([ascii(`<< /Type /XObject /Subtype /Image /Width ${A4W} /Height ${A4H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`),bytes,ascii('\nendstream')]);const content=`q\n595.28 0 0 841.89 0 0 cm\n/Im${i+1} Do\nQ`;const cr=add([ascii(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)]);const pr=add([ascii(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${i+1} ${img} 0 R >> >> /Contents ${cr} 0 R >>`)]);pageRefs.push(pr)});
    objects[catalog-1]=[ascii(`<< /Type /Catalog /Pages ${pages} 0 R >>`)];objects[pages-1]=[ascii(`<< /Type /Pages /Kids [${pageRefs.map(r=>r+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`)];
    const header=ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');let chunks=[header],offsets=[0],pos=header.length;objects.forEach((parts,i)=>{const h=ascii(`${i+1} 0 obj\n`),t=ascii('\nendobj\n');offsets.push(pos);chunks.push(h);pos+=h.length;for(const part of parts){chunks.push(part);pos+=part.length}chunks.push(t);pos+=t.length});const xrefPos=pos;let xref=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';xref+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;chunks.push(ascii(xref));return new Blob(chunks,{type:'application/pdf'});
  }
  window.DreamHousePDF={async export(kind,items,filename){if(!Array.isArray(items)||!items.length)throw new Error('لا توجد بيانات للتصدير');const perPage=kind==='clients'?3:2,groups=[];for(let i=0;i<items.length;i+=perPage)groups.push(items.slice(i,i+perPage));const jpegs=[];for(let i=0;i<groups.length;i++){const c=drawPage(kind,groups[i],i+1,groups.length);jpegs.push(c.toDataURL('image/jpeg',0.97));await new Promise(r=>setTimeout(r,0))}const blob=addPdf(jpegs),file=new File([blob],filename,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:filename});return 'shared'}catch(e){if(e?.name==='AbortError')return 'cancelled'}}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000);return 'downloaded'}};
})();
