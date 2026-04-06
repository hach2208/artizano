import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const supabaseUrl = 'https://qiynvwgphkpvqljgeufm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeW52d2dwaGtwdnFsamdldWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjExNDMsImV4cCI6MjA4NDMzNzE0M30.LFKe211w4DYSs4LtdIbwH8dty-lwwQ4BdWBN1QoUxa0'
const supabase = createClient(supabaseUrl, supabaseKey)

const PRIX = { bulletin: 15, contrat: 30, attestation: 20 }
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const PSS = 3925
const SMIC = 1801.80

const C = {
  orange: '#f7931e',
  orangeLight: '#fff8ed',
  green: '#2f7a3f',
  greenLight: '#e8f5eb',
  dark: '#1e1e1e',
  darkBlue: '#1f4d7a',
  muted: '#6c6c6c',
  light: '#f7f7f9',
  border: '#e6e6e6',
  white: '#ffffff',
  error: '#dc3545',
  purple: '#a04cdd',
  blue: '#4a8dff'
}

const fmt = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0)
const fmtN = (n,d=2) => new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n||0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : ''
const round = (n,d=2) => Math.round((n+Number.EPSILON)*Math.pow(10,d))/Math.pow(10,d)

function calcBulletin(sal, ent, mois, annee, vars={}) {
  const brut = parseFloat(sal.salaire_brut)||0
  const heures = parseFloat(sal.heures)||151.67
  const th = round(brut/heures,4)
  const cadre = sal.statut==='cadre'
  const tPAS = parseFloat(sal.taux_pas)||0
  const tAT = parseFloat(ent?.taux_at)||2.21

  const hs25 = parseFloat(vars.hs25)||0
  const hs50 = parseFloat(vars.hs50)||0
  const primes = parseFloat(vars.primes)||0
  const absJ = parseFloat(vars.absJours)||0

  const mHS25 = round(hs25*th*1.25)
  const mHS50 = round(hs50*th*1.50)
  const dedAbs = absJ>0 ? round((brut/21.67)*absJ) : 0
  const brutT = round(brut+mHS25+mHS50+primes-dedAbs)

  const T1 = Math.min(brutT,PSS)
  const T2 = Math.max(0,brutT-PSS)
  const aCSG = round(brutT*0.9825)

  const cots = [
    {cat:'SANTÉ',lib:'Maladie-Maternité-Invalidité-Décès',base:brutT,tS:0,tP:7.00},
    {cat:'SANTÉ',lib:'Complémentaire santé',base:brutT,tS:0,tP:0,fS:25,fP:25},
    {cat:'AT/MP',lib:'Accidents du travail',base:brutT,tS:0,tP:tAT},
    {cat:'RETRAITE',lib:'Vieillesse plafonnée',base:T1,tS:6.90,tP:8.55},
    {cat:'RETRAITE',lib:'Vieillesse déplafonnée',base:brutT,tS:0.40,tP:2.02},
    {cat:'RETRAITE COMPLÉMENTAIRE',lib:'Retraite Tranche 1',base:T1,tS:3.15,tP:4.72},
    {cat:'RETRAITE COMPLÉMENTAIRE',lib:'CEG Tranche 1',base:T1,tS:0.86,tP:1.29},
    {cat:'FAMILLE',lib:'Allocations familiales',base:brutT,tS:0,tP:brutT<=3.5*SMIC?3.45:5.25},
    {cat:'CHÔMAGE',lib:'Assurance chômage',base:brutT,tS:0,tP:4.05},
    {cat:'CHÔMAGE',lib:'AGS',base:brutT,tS:0,tP:0.20},
    {cat:'CSG/CRDS',lib:'CSG déductible',base:aCSG,tS:6.80,tP:0},
    {cat:'CSG/CRDS',lib:'CSG non déductible',base:aCSG,tS:2.40,tP:0},
    {cat:'CSG/CRDS',lib:'CRDS',base:aCSG,tS:0.50,tP:0},
    {cat:'AUTRES',lib:'FNAL',base:T1,tS:0,tP:0.10},
    {cat:'AUTRES',lib:'Solidarité autonomie',base:brutT,tS:0,tP:0.30},
    {cat:'AUTRES',lib:'Formation professionnelle',base:brutT,tS:0,tP:0.55},
    {cat:'AUTRES',lib:'Taxe apprentissage',base:brutT,tS:0,tP:0.68},
  ]

  if(T2>0){
    cots.splice(7,0,
      {cat:'RETRAITE COMPLÉMENTAIRE',lib:'Retraite Tranche 2',base:T2,tS:8.64,tP:12.95},
      {cat:'RETRAITE COMPLÉMENTAIRE',lib:'CEG Tranche 2',base:T2,tS:1.08,tP:1.62},
      {cat:'RETRAITE COMPLÉMENTAIRE',lib:'CET',base:brutT,tS:0.14,tP:0.21}
    )
  }

  if(cadre){
    const idx = cots.findIndex(c=>c.cat==='CHÔMAGE')
    cots.splice(idx+2,0,{cat:'CHÔMAGE',lib:'APEC',base:brutT,tS:0.024,tP:0.036})
    cots.push({cat:'PRÉVOYANCE',lib:'Prévoyance cadre',base:T1,tS:0,tP:1.50})
  }

  let totS=0, totP=0
  const cotsCalc = cots.map(c=>{
    const pS = c.fS!==undefined ? c.fS : round(c.base*c.tS/100)
    const pP = c.fP!==undefined ? c.fP : round(c.base*c.tP/100)
    totS+=pS; totP+=pP
    return {...c,pS,pP}
  })

  const csgND = round(aCSG*2.40/100)
  const crds = round(aCSG*0.50/100)
  const netAI = round(brutT-totS)
  const netImp = round(netAI+csgND+crds)
  const mPAS = round(netImp*tPAS/100)
  const netAP = round(netAI-mPAS)
  const coutE = round(brutT+totP)

  return {
    mois,annee,heures,th,base:brut,hs25,mHS25,hs50,mHS50,primes,absJ,dedAbs,brutT,
    T1,T2,cots:cotsCalc,totS:round(totS),totP:round(totP),
    netAI,netImp,tPAS,mPAS,netAP,coutE,cpAcq:2.08
  }
}

function convertBN(brut,st='non-cadre'){const t=st==='cadre'?0.25:0.23;return{brut:round(brut),net:round(brut*(1-t)),charges:round(brut*t),taux:round(t*100)}}
function convertNB(net,st='non-cadre'){const t=st==='cadre'?0.25:0.23;const b=net/(1-t);return{brut:round(b),net:round(net),charges:round(b*t),taux:round(t*100)}}

async function searchEnt(q){
  if(!q||q.length<3)return[]
  try{
    const r=await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=8`)
    const d=await r.json()
    return(d.results||[]).map(e=>({nom:e.nom_complet||'',siret:e.siege?.siret||'',adresse:e.siege?.adresse||'',cp:e.siege?.code_postal||'',ville:e.siege?.libelle_commune||'',ape:e.activite_principale||''}))
  }catch{return[]}
}

function genPDFBulletin(bull,sal,ent,specimen=false){
  const doc=new jsPDF()
  const m=MOIS[bull.mois-1]

  if(specimen){doc.setTextColor(220,220,220);doc.setFontSize(70);doc.setFont('helvetica','bold');doc.text('SPECIMEN',105,150,{align:'center',angle:45});doc.setTextColor(0,0,0)}

  doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('BULLETIN DE PAIE',105,15,{align:'center'})
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text(`${m} ${bull.annee}`,105,22,{align:'center'})
  doc.line(14,26,196,26)

  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('EMPLOYEUR',14,33)
  doc.setFont('helvetica','normal');doc.setFontSize(8)
  doc.text(ent?.nom||'',14,38);doc.text(ent?.adresse||'',14,42);doc.text(`${ent?.cp||''} ${ent?.ville||''}`,14,46)
  doc.text(`SIRET: ${ent?.siret||''}`,14,50);doc.text(`APE: ${ent?.ape||''}`,14,54)

  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('SALARIÉ',110,33)
  doc.setFont('helvetica','normal');doc.setFontSize(8)
  doc.text(`${sal?.prenom||''} ${sal?.nom||''}`,110,38);doc.text(`${sal?.adresse||''}`,110,42)
  doc.text(`${sal?.cp||''} ${sal?.ville||''}`,110,46);doc.text(`N° SS: ${sal?.num_ss||''}`,110,50)
  doc.text(`Emploi: ${sal?.emploi||''}`,110,54);doc.text(`Statut: ${sal?.statut||''}`,110,58)
  doc.line(14,62,196,62)

  const body=[]
  body.push([{content:`Salaire de base (${fmtN(bull.heures||151.67)}h × ${fmtN(bull.th||0,4)}€)`,styles:{fillColor:[235,245,255],fontStyle:'bold'}},'','',{content:fmtN(bull.base||0),styles:{fillColor:[235,245,255]}},'',''])
  if(bull.mHS25>0)body.push([`Heures supp. 25% (${bull.hs25}h)`,'','',fmtN(bull.mHS25),'',''])
  if(bull.mHS50>0)body.push([`Heures supp. 50% (${bull.hs50}h)`,'','',fmtN(bull.mHS50),'',''])
  if(bull.primes>0)body.push(['Primes','','',fmtN(bull.primes),'',''])
  if(bull.dedAbs>0)body.push([`Absence (${bull.absJ}j)`,'','',`-${fmtN(bull.dedAbs)}`,'',''])
  body.push([{content:'SALAIRE BRUT',styles:{fillColor:[255,250,200],fontStyle:'bold'}},'','',{content:fmtN(bull.brutT||bull.base||0),styles:{fillColor:[255,250,200],fontStyle:'bold'}},'',''])

  let cat=''
  ;(bull.cots||[]).forEach(c=>{
    if(c.cat!==cat){body.push([{content:c.cat,styles:{fillColor:[230,230,230],fontStyle:'bold'},colSpan:6}]);cat=c.cat}
    body.push(['   '+c.lib,fmtN(c.base),c.tS>0?fmtN(c.tS)+'%':'',c.pS>0?fmtN(c.pS):'',c.tP>0?fmtN(c.tP)+'%':'',c.pP>0?fmtN(c.pP):''])
  })
  body.push([{content:'TOTAL COTISATIONS',styles:{fillColor:[30,40,70],textColor:[255,255,255],fontStyle:'bold'}},'','',{content:fmtN(bull.totS||0),styles:{fillColor:[30,40,70],textColor:[255,255,255]}},'',{content:fmtN(bull.totP||0),styles:{fillColor:[30,40,70],textColor:[255,255,255]}}])

  doc.autoTable({startY:66,head:[['Désignation','Base','Taux S.','Part S.','Taux P.','Part P.']],body,theme:'grid',styles:{fontSize:7,cellPadding:1.5},headStyles:{fillColor:[31,77,122],textColor:[255,255,255],fontSize:7},columnStyles:{0:{cellWidth:60},1:{cellWidth:24,halign:'right'},2:{cellWidth:18,halign:'right'},3:{cellWidth:24,halign:'right'},4:{cellWidth:18,halign:'right'},5:{cellWidth:24,halign:'right'}}})

  let y=doc.lastAutoTable.finalY+8
  doc.setFontSize(9);doc.text(`Net avant impôt: ${fmtN(bull.netAI||0)} €`,14,y)
  doc.text(`Net imposable: ${fmtN(bull.netImp||0)} €`,14,y+5)
  doc.text(`Impôt sur le revenu (${fmtN(bull.tPAS||0)}%): -${fmtN(bull.mPAS||0)} €`,14,y+10)

  doc.setFillColor(47,122,63);doc.rect(125,y-5,70,22,'F')
  doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont('helvetica','bold')
  doc.text('NET À PAYER',160,y+2,{align:'center'})
  doc.setFontSize(16);doc.text(`${fmtN(bull.netAP||0)} €`,160,y+13,{align:'center'})
  doc.setTextColor(0,0,0)

  y+=28;doc.setFontSize(8);doc.setFont('helvetica','normal')
  doc.setFillColor(245,245,245);doc.rect(14,y-3,182,8,'F')
  doc.text(`Coût total employeur: ${fmtN(bull.coutE||0)} €`,16,y+2)

  y+=15;doc.setFontSize(6);doc.setTextColor(120,120,120)
  doc.text('Conservez ce bulletin sans limitation de durée.',14,y)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par PaieExpress`,14,y+4)

  return doc
}

function genPDFContrat(type,sal,ent,opts={}){
  const doc=new jsPDF()
  const titre=type==='cdi'?'CONTRAT À DURÉE INDÉTERMINÉE':type==='cdd'?'CONTRAT À DURÉE DÉTERMINÉE':'CONTRAT DE TRAVAIL'

  doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text(titre,105,20,{align:'center'})
  let y=40;doc.setFontSize(10);doc.setFont('helvetica','normal')

  doc.text('Entre les soussignés :',14,y);y+=10
  doc.setFont('helvetica','bold');doc.text("L'EMPLOYEUR :",14,y);doc.setFont('helvetica','normal');y+=6
  doc.text(`${ent?.nom||'___'}`,14,y);y+=5
  doc.text(`${ent?.adresse||''}, ${ent?.cp||''} ${ent?.ville||''}`,14,y);y+=5
  doc.text(`SIRET : ${ent?.siret||'___'}`,14,y);y+=10

  doc.setFont('helvetica','bold');doc.text('LE SALARIÉ :',14,y);doc.setFont('helvetica','normal');y+=6
  doc.text(`${sal?.prenom||''} ${sal?.nom||''}`,14,y);y+=5
  doc.text(`Demeurant : ${sal?.adresse||''}, ${sal?.cp||''} ${sal?.ville||''}`,14,y);y+=5
  doc.text(`N° Sécurité sociale : ${sal?.num_ss||'___'}`,14,y);y+=15

  doc.setFont('helvetica','bold');doc.text('Il a été convenu ce qui suit :',14,y);y+=10

  const arts=[
    {t:'Article 1 - Engagement',c:`La société engage ${sal?.prenom||''} ${sal?.nom||''} en qualité de ${sal?.emploi||'___'}.`},
    {t:"Article 2 - Date d'effet",c:type==='cdi'?`Le présent contrat prend effet le ${fmtDate(sal?.date_entree)||'___'}. Il est conclu pour une durée indéterminée.`:`Le présent contrat prend effet le ${fmtDate(sal?.date_entree)||'___'} pour une durée de ${opts.duree||6} mois.\n\nMotif : ${opts.motif||"Accroissement temporaire d'activité"}`},
    {t:"Article 3 - Période d'essai",c:type==='cdi'?`Période d'essai de ${sal?.statut==='cadre'?'4':'2'} mois, renouvelable une fois.`:"Période d'essai selon dispositions légales."},
    {t:'Article 4 - Durée du travail',c:`${sal?.heures||151.67} heures par mois, soit 35 heures hebdomadaires.`},
    {t:'Article 5 - Rémunération',c:`Rémunération mensuelle brute de ${fmt(sal?.salaire_brut||0)}.`},
    {t:'Article 6 - Lieu de travail',c:`${ent?.adresse||''}, ${ent?.cp||''} ${ent?.ville||''}`},
    {t:'Article 7 - Congés payés',c:'2,5 jours ouvrables par mois de travail effectif.'},
  ]

  doc.setFontSize(9)
  arts.forEach(a=>{
    if(y>250){doc.addPage();y=20}
    doc.setFont('helvetica','bold');doc.text(a.t,14,y);doc.setFont('helvetica','normal');y+=5
    const lines=doc.splitTextToSize(a.c,180);doc.text(lines,14,y);y+=lines.length*4+8
  })

  y+=10;doc.setFontSize(10)
  doc.text(`Fait à ${ent?.ville||'___'}, le ${new Date().toLocaleDateString('fr-FR')}`,14,y)
  y+=15;doc.text("L'Employeur",50,y,{align:'center'});doc.text('Le Salarié',150,y,{align:'center'})

  return doc
}

function genPDFAttestation(type,sal,ent){
  const doc=new jsPDF()
  const titres={travail:'ATTESTATION DE TRAVAIL',employeur:'ATTESTATION EMPLOYEUR',certificat:'CERTIFICAT DE TRAVAIL'}

  doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text(titres[type]||'ATTESTATION',105,20,{align:'center'})
  let y=45;doc.setFontSize(11);doc.setFont('helvetica','normal')

  doc.text('Je soussigné(e),',14,y);y+=8
  doc.text(`Représentant de ${ent?.nom||'___'}`,14,y);y+=5
  doc.text(`${ent?.adresse||''}, ${ent?.cp||''} ${ent?.ville||''}`,14,y);y+=5
  doc.text(`SIRET : ${ent?.siret||'___'}`,14,y);y+=12

  doc.text('Certifie que :',14,y);y+=10
  doc.setFont('helvetica','bold');doc.text(`${sal?.prenom||''} ${sal?.nom||''}`,14,y);doc.setFont('helvetica','normal');y+=6
  doc.text(`N° SS : ${sal?.num_ss||'___'}`,14,y);y+=5
  doc.text(`Demeurant : ${sal?.adresse||''}, ${sal?.cp||''} ${sal?.ville||''}`,14,y);y+=12

  if(type==='travail'){
    doc.text(`Est employé(e) depuis le ${fmtDate(sal?.date_entree)||'___'}`,14,y);y+=6
    doc.text(`En qualité de : ${sal?.emploi||'___'}`,14,y);y+=6
    doc.text(`Rémunération brute mensuelle : ${fmt(sal?.salaire_brut||0)}`,14,y)
  }else if(type==='certificat'){
    doc.text(`A été employé(e) du ${fmtDate(sal?.date_entree)||'___'} au ${fmtDate(sal?.date_sortie)||new Date().toLocaleDateString('fr-FR')}`,14,y);y+=6
    doc.text(`En qualité de : ${sal?.emploi||'___'}`,14,y);y+=10
    doc.text('Le (la) salarié(e) nous quitte libre de tout engagement.',14,y)
  }else{
    doc.text(`Est bien employé(e) au sein de notre entreprise.`,14,y)
  }

  y+=20;doc.text('Cette attestation est délivrée pour servir et valoir ce que de droit.',14,y)
  y+=15;doc.text(`Fait à ${ent?.ville||'___'}, le ${new Date().toLocaleDateString('fr-FR')}`,14,y)
  y+=15;doc.setFont('helvetica','bold');doc.text('Signature et cachet',14,y)

  return doc
}

function genDSN(bulls,sals,ent,mois,annee){
  const p=`${annee}${String(mois).padStart(2,'0')}`
  let d=`S10.G00.00.001,'${p}'\nS10.G00.00.002,'01'\nS10.G00.00.003,'01'\nS10.G00.00.004,'PaieExpress'\n`
  d+=`S21.G00.06.001,'${ent?.siret||''}'\nS21.G00.06.002,'${ent?.ape||''}'\n`
  d+=`S21.G00.11.001,'${ent?.adresse||''}'\nS21.G00.11.004,'${ent?.cp||''}'\nS21.G00.11.005,'${ent?.ville||''}'\n`
  bulls.forEach((b,i)=>{
    const s=sals.find(x=>x.id===b.salarie_id)||b.salaries||{}
    d+=`S21.G00.30.001,'${s.num_ss||''}'\nS21.G00.30.002,'${s.nom||''}'\nS21.G00.30.003,'${s.prenom||''}'\n`
    d+=`S21.G00.51.011,'${b.brut_total||0}'\nS21.G00.51.013,'${b.net_a_payer||0}'\n`
  })
  return d
}

const S={
  inp:{width:'100%',padding:'12px 16px',borderRadius:'6px',border:`1px solid ${C.border}`,fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:'Inter, sans-serif'},
  btn:{padding:'10px 20px',borderRadius:'6px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'13px',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',fontFamily:'Inter, sans-serif'},
  card:{backgroundColor:C.white,borderRadius:'10px',border:`1px solid ${C.border}`,boxShadow:'0 5px 12px rgba(0,0,0,0.05)'},
  modal:{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'16px',overflow:'auto'},
}

export default function App(){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [page,setPage]=useState('home')
  const [authMode,setAuthMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [authErr,setAuthErr]=useState('')
  const [authLoad,setAuthLoad]=useState(false)

  const [ent,setEnt]=useState(null)
  const [sals,setSals]=useState([])
  const [bulls,setBulls]=useState([])
  const [panier,setPanier]=useState([])

  const [modal,setModal]=useState(null)
  const [curSal,setCurSal]=useState(null)
  const [curBull,setCurBull]=useState(null)
  const [editId,setEditId]=useState(null)

  const [pdfUrl,setPdfUrl]=useState(null)
  const [pdfFilename,setPdfFilename]=useState('')

  const [fEnt,setFEnt]=useState({nom:'',siret:'',adresse:'',cp:'',ville:'',ape:'',taux_at:2.21})
  const [fSal,setFSal]=useState({prenom:'',nom:'',num_ss:'',adresse:'',cp:'',ville:'',date_entree:'',emploi:'',statut:'non-cadre',heures:151.67,salaire_brut:'',taux_pas:0})
  const [fBull,setFBull]=useState({mois:new Date().getMonth()+1,annee:new Date().getFullYear()})
  const [fVars,setFVars]=useState({hs25:0,hs50:0,primes:0,absJours:0})
  const [fContrat,setFContrat]=useState({type:'cdi',duree:6,motif:''})

  const [searchQ,setSearchQ]=useState('')
  const [searchR,setSearchR]=useState([])
  const [searchL,setSearchL]=useState(false)

  const [convMode,setConvMode]=useState('brut')
  const [convVal,setConvVal]=useState('')
  const [convStat,setConvStat]=useState('non-cadre')
  const [convRes,setConvRes]=useState(null)

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{setUser(user);setLoading(false);if(user)setPage('dashboard')})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((e,sess)=>{setUser(sess?.user||null);if(sess?.user)setPage('dashboard')})
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{if(user)loadData()},[user])

  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(searchQ.length>=3){setSearchL(true);const r=await searchEnt(searchQ);setSearchR(r);setSearchL(false)}else setSearchR([])
    },400)
    return ()=>clearTimeout(t)
  },[searchQ])

  const loadData=async()=>{
    const {data:e}=await supabase.from('entreprises').select('*').eq('user_id',user.id).single()
    if(e){
      setEnt(e)
      const {data:s}=await supabase.from('salaries').select('*').eq('entreprise_id',e.id).eq('actif',true).order('nom')
      setSals(s||[])
      const {data:b}=await supabase.from('bulletins').select('*,salaries(*)').eq('entreprise_id',e.id).order('created_at',{ascending:false}).limit(50)
      setBulls(b||[])
    }
  }

  const handleAuth=async e=>{
    e.preventDefault();setAuthErr('');setAuthLoad(true)
    try{
      if(authMode==='login'){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error}
      else{const {error}=await supabase.auth.signUp({email,password});if(error)throw error;setAuthErr('✓ Compte créé ! Connectez-vous.');setAuthMode('login')}
    }catch(err){setAuthErr(err.message)}
    setAuthLoad(false)
  }

  const logout=async()=>{await supabase.auth.signOut();setUser(null);setEnt(null);setSals([]);setBulls([]);setPanier([]);setPage('home')}

  const saveEnt=async e=>{
    e.preventDefault()
    try{
      let data
      if(ent?.id){
        const res=await supabase.from('entreprises').update(fEnt).eq('id',ent.id).select().single()
        data=res.data;if(res.error)throw res.error
      }else{
        const res=await supabase.from('entreprises').insert({...fEnt,user_id:user.id}).select().single()
        data=res.data;if(res.error)throw res.error
      }
      if(data){setEnt(data);setModal(null)}
    }catch(err){alert('Erreur: '+err.message)}
  }

  const selectEnt=x=>{setFEnt({...fEnt,nom:x.nom,siret:x.siret,adresse:x.adresse,cp:x.cp,ville:x.ville,ape:x.ape});setSearchQ('');setSearchR([])}

  const saveSal=async e=>{
    e.preventDefault()
    try{
      if(editId){
        const {data,error}=await supabase.from('salaries').update(fSal).eq('id',editId).select().single()
        if(error)throw error
        if(data)setSals(sals.map(s=>s.id===editId?data:s))
      }else{
        const {data,error}=await supabase.from('salaries').insert({...fSal,entreprise_id:ent.id}).select().single()
        if(error)throw error
        if(data)setSals([...sals,data])
      }
      setEditId(null);setModal(null)
    }catch(err){alert('Erreur: '+err.message)}
  }

  const delSal=async id=>{if(!confirm('Supprimer ce salarié ?'))return;await supabase.from('salaries').update({actif:false}).eq('id',id);setSals(sals.filter(s=>s.id!==id))}

  const genBull=async e=>{
    e.preventDefault()
    const b=calcBulletin(curSal,ent,fBull.mois,fBull.annee,fVars)
    const {data}=await supabase.from('bulletins').insert({
      entreprise_id:ent.id,salarie_id:curSal.id,mois:fBull.mois,annee:fBull.annee,
      brut_total:b.brutT,cotisations:b.cots,total_cotisations_sal:b.totS,total_cotisations_pat:b.totP,
      net_avant_impot:b.netAI,net_imposable:b.netImp,taux_pas:b.tPAS,montant_pas:b.mPAS,
      net_a_payer:b.netAP,cout_employeur:b.coutE,paye:false
    }).select('*,salaries(*)').single()
    if(data){
      const nb={...data,...b,salarie:curSal}
      setBulls([nb,...bulls])
      setCurBull(nb)
      showPdfPreview('bulletin',nb,curSal,true)
    }
  }

  const showPdfPreview=(type,data,sal,isSpecimen=false)=>{
    try{
      let doc,filename
      if(type==='bulletin'){
        doc=genPDFBulletin(data,sal,ent,isSpecimen)
        filename=`bulletin-${sal?.nom||'sal'}-${data.mois}-${data.annee}.pdf`
      }else if(type==='contrat'){
        doc=genPDFContrat(fContrat.type,sal,ent,fContrat)
        filename=`contrat-${fContrat.type}-${sal?.nom||'sal'}.pdf`
      }else if(type.startsWith('att_')){
        const attType=type.replace('att_','')
        doc=genPDFAttestation(attType,sal,ent)
        filename=`${attType}-${sal?.nom||'sal'}.pdf`
      }
      const blob=doc.output('blob')
      const url=URL.createObjectURL(blob)
      setPdfUrl(url);setPdfFilename(filename);setModal('pdfPreview')
    }catch(err){alert('Erreur: '+err.message)}
  }

  const downloadPdf=()=>{if(pdfUrl){const a=document.createElement('a');a.href=pdfUrl;a.download=pdfFilename;a.click()}}
  const closePdf=()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl);setPdfUrl(null);setPdfFilename('');setModal(null)}

  const previewContrat=()=>{if(!curSal||!ent)return alert('Sélectionnez un salarié');showPdfPreview('contrat',null,curSal)}
  const previewAtt=type=>{if(!curSal||!ent)return alert('Sélectionnez un salarié');showPdfPreview('att_'+type,null,curSal)}
  const viewBulletin=bull=>{const sal=bull.salarie||bull.salaries;setCurBull(bull);showPdfPreview('bulletin',bull,sal,!bull.paye)}

  const dlDSN=()=>{
    const bs=bulls.filter(b=>b.mois===fBull.mois&&b.annee===fBull.annee)
    if(!bs.length)return alert('Aucun bulletin')
    const d=genDSN(bs,sals,ent,fBull.mois,fBull.annee)
    const blob=new Blob([d],{type:'text/plain'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download=`DSN-${fBull.mois}-${fBull.annee}.txt`;a.click()
    URL.revokeObjectURL(url)
  }

  const addPanier=(item,type)=>{if(!panier.find(p=>p.item.id===item.id&&p.type===type))setPanier([...panier,{id:Date.now(),item,type,prix:PRIX[type]||15}])}
  const rmPanier=id=>setPanier(panier.filter(p=>p.id!==id))
  const totPanier=panier.reduce((a,p)=>a+p.prix,0)

  const payer=async()=>{
    for(const p of panier){
      if(p.type==='bulletin'){
        await supabase.from('bulletins').update({paye:true}).eq('id',p.item.id)
        setBulls(bs=>bs.map(b=>b.id===p.item.id?{...b,paye:true}:b))
      }
    }
    setPanier([]);setModal('payOk')
  }

  const doConv=()=>{const v=parseFloat(convVal)||0;if(v<=0)return;setConvRes(convMode==='brut'?convertBN(v,convStat):convertNB(v,convStat))}
  const resetFSal=()=>setFSal({prenom:'',nom:'',num_ss:'',adresse:'',cp:'',ville:'',date_entree:'',emploi:'',statut:'non-cadre',heures:151.67,salaire_brut:'',taux_pas:0})

  if(loading)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:C.light}}><div style={{width:48,height:48,border:`4px solid ${C.orange}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>)

  if(!user&&page==='home')return(
    <div style={{minHeight:'100vh',backgroundColor:C.white,fontFamily:'Merriweather, serif'}}>
      <header style={{borderBottom:`1px solid ${C.border}`,backgroundColor:C.white,position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.darkBlue,fontSize:14,fontFamily:'Inter, sans-serif'}}>P</div>
            <span style={{fontFamily:'Inter, sans-serif',fontWeight:700,letterSpacing:0.5,color:C.dark}}>PaieExpress</span>
          </div>
          <nav style={{display:'flex',gap:22,fontFamily:'Inter, sans-serif',fontSize:13,color:C.dark}}>
            <span style={{cursor:'pointer'}}>Accueil</span>
            <span style={{cursor:'pointer'}} onClick={()=>setPage('tarifs')}>Nos Tarifs</span>
            <span style={{cursor:'pointer'}} onClick={()=>setPage('conv')}>Convertir Brut en Net</span>
          </nav>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>{setPage('auth');setAuthMode('register')}} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>S'inscrire</button>
            <button onClick={()=>{setPage('auth');setAuthMode('login')}} style={{...S.btn,border:`1px solid ${C.border}`,backgroundColor:C.white,color:C.dark}}>Se connecter</button>
          </div>
        </div>
      </header>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'48px 24px',display:'grid',gridTemplateColumns:'1.1fr 0.9fr',alignItems:'center',gap:24}}>
        <div>
          <h1 style={{fontSize:28,lineHeight:1.25,marginBottom:12,fontFamily:'Inter, sans-serif',color:'#222'}}>Réalisez vos fiches de paie<br/>en quelques clics</h1>
          <ul style={{paddingLeft:18,margin:'0 0 16px',color:'#555',fontFamily:'Inter, sans-serif',fontSize:13,lineHeight:1.8}}>
            <li>Vos fiches de paie en moins de 5 min</li>
            <li>Analyse des fiches de paie en temps réel</li>
            <li>Création de contrats et DSN</li>
            <li>Téléchargement immédiat et illimité</li>
            <li>Conformité 100% réglementation</li>
            <li>Essai gratuit - Sans engagement</li>
          </ul>
          <button onClick={()=>setPage('auth')} style={{...S.btn,backgroundColor:C.green,color:C.white,padding:'12px 28px',fontSize:14}}>Commencez maintenant</button>
        </div>
        <div style={{display:'flex',justifyContent:'center'}}>
          <div style={{width:350,height:280,backgroundColor:C.light,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,border:`2px dashed ${C.border}`}}>
            <span style={{fontSize:80}}>📄</span>
            <p style={{color:C.muted,fontWeight:600,fontFamily:'Inter, sans-serif',fontSize:14}}>Bulletins professionnels</p>
          </div>
        </div>
      </section>

      <h2 style={{textAlign:'center',margin:'36px 0 18px',fontSize:16,color:'#333',fontFamily:'Inter, sans-serif',fontWeight:600}}>Offre tout compris à 15 euros la fiche de paie</h2>
      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 48px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
        {[
          {icon:'🧾',title:'La fiche de paie',price:'15 euros'},
          {icon:'📝',title:'Contrat de travail',price:'30 euros'},
          {icon:'📋',title:'Déclarations DSN',price:'Gratuit'}
        ].map((c,i)=>(
          <div key={i} style={{...S.card,padding:18,textAlign:'center'}}>
            <div style={{fontSize:38,color:C.orange,marginBottom:10}}>{c.icon}</div>
            <h3 style={{fontSize:14,fontFamily:'Inter, sans-serif',margin:'0 0 6px'}}>{c.title}</h3>
            <div style={{fontSize:12,color:'#333',marginBottom:14,fontFamily:'Inter, sans-serif'}}>{c.price}</div>
            <span style={{display:'inline-block',border:`1px solid #b8c1d6`,color:C.darkBlue,borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,fontFamily:'Inter, sans-serif'}}>Essai gratuit</span>
          </div>
        ))}
      </section>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 48px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center'}}>
        <div style={{width:180,height:180,backgroundColor:'#f2f7ff',borderRadius:24,display:'grid',placeItems:'center',color:C.darkBlue,fontSize:42,boxShadow:'0 12px 22px rgba(0,0,0,0.06)'}}>🧮</div>
        <div>
          <h3 style={{fontFamily:'Inter, sans-serif',fontSize:18,marginBottom:12}}>Qui sommes-nous</h3>
          <p style={{color:'#555',fontSize:14,lineHeight:1.7,fontFamily:'Inter, sans-serif'}}>Avec PaieExpress, vous avez la réussite de la paie de vos employés à tout moment. Une solution simple et rapide pour générer vos fiches de paie, vos contrats de travail et vos déclarations sociales.</p>
        </div>
      </section>

      <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 48px'}}>
        <h3 style={{textAlign:'center',marginBottom:24,fontFamily:'Inter, sans-serif'}}>La fiche de paie</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {bg:C.orange,text:'La fiche de paie est un document destiné à informer le salarié sur le versement du salaire.'},
            {bg:C.blue,text:'Le bulletin de paie contient le salaire brut, les primes, les heures, les charges sociales.'},
            {bg:C.purple,text:'Avec PaieExpress réalisez les bulletins de vos salariés en quelques clics.'},
          ].map((p,i)=>(
            <div key={i} style={{padding:14,borderRadius:10,color:C.white,fontFamily:'Inter, sans-serif',fontSize:12,lineHeight:1.4,minHeight:90,backgroundColor:p.bg}}>{p.text}</div>
          ))}
        </div>
      </section>

      <section style={{backgroundColor:C.light,padding:'26px 0 36px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px'}}>
          <h2 style={{textAlign:'center',fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600,marginBottom:18}}>Services</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {['Modification des fiches de paie','Facile et rapide','Compte et accès en ligne','Fiche de paie','Déclarations sociales DSN','Contrats de travail'].map((s,i)=>(
              <div key={i} style={{...S.card,padding:16,textAlign:'center',fontFamily:'Inter, sans-serif',fontSize:12}}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{backgroundColor:'#0d0f1a',color:C.white,padding:'28px 0',fontFamily:'Inter, sans-serif',fontSize:12}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:20}}>
          <div><strong>PAIE EXPRESS</strong><p style={{color:'#c6c6c6',marginTop:8}}>Un logiciel simple et sécurisé pour la gestion de paie.</p></div>
          <div><h4 style={{color:C.white,fontSize:12,marginBottom:8,fontWeight:600}}>SERVICES</h4><a href="#" style={{color:'#c6c6c6',display:'block',marginBottom:6}}>Convertir brut en net</a><a href="#" style={{color:'#c6c6c6',display:'block',marginBottom:6}}>Documents</a></div>
          <div><h4 style={{color:C.white,fontSize:12,marginBottom:8,fontWeight:600}}>LÉGAL</h4><a href="#" onClick={e=>{e.preventDefault();setPage('cgv')}} style={{color:'#c6c6c6',display:'block',marginBottom:6}}>CGV/CGU</a><a href="#" onClick={e=>{e.preventDefault();setPage('mentions')}} style={{color:'#c6c6c6',display:'block',marginBottom:6}}>Mentions légales</a></div>
          <div><h4 style={{color:C.white,fontSize:12,marginBottom:8,fontWeight:600}}>CONTACT</h4><a href="#" style={{color:'#c6c6c6',display:'block',marginBottom:6}}>contact@paieexpress.fr</a></div>
        </div>
        <div style={{maxWidth:1100,margin:'16px auto 0',padding:'0 24px',color:'#9a9a9a',fontSize:11}}>Copyright © {new Date().getFullYear()} PaieExpress. Tous droits réservés.</div>
      </footer>
    </div>
  )

  if(page==='cgv')return(
    <div style={{minHeight:'100vh',backgroundColor:C.light}}>
      <header style={{borderBottom:`1px solid ${C.border}`,backgroundColor:C.white,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setPage('home')}><div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.darkBlue,fontSize:14}}>P</div><span style={{fontFamily:'Inter, sans-serif',fontWeight:700}}>PaieExpress</span></div>
        <button onClick={()=>setPage(user?'dashboard':'home')} style={{...S.btn,backgroundColor:C.light,color:C.dark}}>← Retour</button>
      </header>
      <div style={{maxWidth:800,margin:'48px auto',padding:'0 24px'}}><div style={{...S.card,padding:48}}><h1 style={{fontSize:24,fontFamily:'Inter, sans-serif',marginBottom:24}}>Conditions Générales de Vente</h1><p style={{color:'#555',lineHeight:1.7,fontFamily:'Inter, sans-serif',fontSize:14}}>Les présentes CGV régissent l'utilisation du service PaieExpress. Tarifs : Bulletin 15€, Contrat 30€, Attestation 20€, DSN Gratuit. Le paiement s'effectue en ligne. Conformément au RGPD, vous disposez d'un droit d'accès à vos données.</p></div></div>
    </div>
  )

  if(page==='mentions')return(
    <div style={{minHeight:'100vh',backgroundColor:C.light}}>
      <header style={{borderBottom:`1px solid ${C.border}`,backgroundColor:C.white,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setPage('home')}><div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.darkBlue,fontSize:14}}>P</div><span style={{fontFamily:'Inter, sans-serif',fontWeight:700}}>PaieExpress</span></div>
        <button onClick={()=>setPage(user?'dashboard':'home')} style={{...S.btn,backgroundColor:C.light,color:C.dark}}>← Retour</button>
      </header>
      <div style={{maxWidth:800,margin:'48px auto',padding:'0 24px'}}><div style={{...S.card,padding:48}}><h1 style={{fontSize:24,fontFamily:'Inter, sans-serif',marginBottom:24}}>Mentions Légales</h1><p style={{color:'#555',lineHeight:1.7,fontFamily:'Inter, sans-serif',fontSize:14}}>PaieExpress - Service de paie en ligne. Ce site est hébergé par Vercel Inc. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p></div></div>
    </div>
  )

  if(page==='conv'&&!user)return(
    <div style={{minHeight:'100vh',backgroundColor:C.light}}>
      <header style={{borderBottom:`1px solid ${C.border}`,backgroundColor:C.white,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setPage('home')}><div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.darkBlue,fontSize:14}}>P</div><span style={{fontFamily:'Inter, sans-serif',fontWeight:700}}>PaieExpress</span></div>
        <button onClick={()=>setPage('home')} style={{...S.btn,backgroundColor:C.light,color:C.dark}}>← Retour</button>
      </header>
      <div style={{maxWidth:450,margin:'48px auto',padding:'0 24px'}}>
        <div style={{...S.card,padding:32}}>
          <h2 style={{fontSize:22,fontFamily:'Inter, sans-serif',textAlign:'center',marginBottom:24}}>Convertisseur Brut ↔ Net</h2>
          <div style={{display:'flex',gap:8,marginBottom:24}}>
            <button onClick={()=>{setConvMode('brut');setConvRes(null)}} style={{...S.btn,flex:1,backgroundColor:convMode==='brut'?C.orange:'#eee',color:convMode==='brut'?C.white:C.dark}}>Brut → Net</button>
            <button onClick={()=>{setConvMode('net');setConvRes(null)}} style={{...S.btn,flex:1,backgroundColor:convMode==='net'?C.orange:'#eee',color:convMode==='net'?C.white:C.dark}}>Net → Brut</button>
          </div>
          <div style={{marginBottom:16}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontFamily:'Inter, sans-serif',fontSize:13}}>Salaire {convMode==='brut'?'brut':'net'} (€)</label><input type="number" value={convVal} onChange={e=>setConvVal(e.target.value)} style={S.inp} placeholder="Ex: 2500"/></div>
          <div style={{marginBottom:24}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontFamily:'Inter, sans-serif',fontSize:13}}>Statut</label><select value={convStat} onChange={e=>setConvStat(e.target.value)} style={S.inp}><option value="non-cadre">Non-cadre (~23%)</option><option value="cadre">Cadre (~25%)</option></select></div>
          <button onClick={doConv} style={{...S.btn,backgroundColor:C.green,color:C.white,width:'100%'}}>Calculer</button>
          {convRes&&(<div style={{marginTop:24,padding:20,backgroundColor:C.greenLight,borderRadius:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontFamily:'Inter, sans-serif',fontSize:13}}>Brut</span><span style={{fontWeight:700}}>{fmt(convRes.brut)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontFamily:'Inter, sans-serif',fontSize:13}}>Charges</span><span style={{fontWeight:700,color:C.error}}>-{fmt(convRes.charges)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid #ccc'}}><span style={{fontWeight:700}}>Net</span><span style={{fontWeight:800,fontSize:18,color:C.green}}>{fmt(convRes.net)}</span></div>
          </div>)}
        </div>
      </div>
    </div>
  )

  if(!user&&page==='auth')return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:C.light,padding:16}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:50,height:50,border:`2px solid ${C.orange}`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:C.darkBlue,fontSize:18,margin:'0 auto 12px'}}>P</div>
          <h1 style={{fontFamily:'Inter, sans-serif',fontSize:22}}>PaieExpress</h1>
        </div>
        <div style={{...S.card,padding:32}}>
          <div style={{display:'flex',marginBottom:24}}>
            {['login','register'].map(m=>(<button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,padding:12,border:'none',cursor:'pointer',fontWeight:600,backgroundColor:authMode===m?C.orange:'#f1f1f1',color:authMode===m?C.white:C.dark,borderRadius:m==='login'?'6px 0 0 6px':'0 6px 6px 0',fontFamily:'Inter, sans-serif',fontSize:13}}>{m==='login'?'Connexion':'Inscription'}</button>))}
          </div>
          <form onSubmit={handleAuth}>
            <div style={{marginBottom:16}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontFamily:'Inter, sans-serif',fontSize:13}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={S.inp} required/></div>
            <div style={{marginBottom:16}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontFamily:'Inter, sans-serif',fontSize:13}}>Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={S.inp} required minLength={6}/></div>
            {authErr&&<p style={{color:authErr.startsWith('✓')?C.green:C.error,backgroundColor:authErr.startsWith('✓')?C.greenLight:'#fee',padding:12,borderRadius:6,marginBottom:16,fontSize:13}}>{authErr}</p>}
            <button type="submit" disabled={authLoad} style={{...S.btn,backgroundColor:C.orange,color:C.white,width:'100%'}}>{authLoad?'Chargement...':(authMode==='login'?'Se connecter':'Créer un compte')}</button>
          </form>
          <p style={{textAlign:'center',marginTop:16}}><button onClick={()=>setPage('home')} style={{background:'none',border:'none',color:C.darkBlue,cursor:'pointer',fontFamily:'Inter, sans-serif'}}>← Retour à l'accueil</button></p>
        </div>
      </div>
    </div>
  )

  return(
    <div style={{minHeight:'100vh',display:'flex',backgroundColor:C.light}}>
      <aside style={{width:240,backgroundColor:'#0d0f1a',color:C.white,position:'fixed',height:'100%',display:'flex',flexDirection:'column',fontFamily:'Inter, sans-serif'}}>
        <div style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
            <div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14}}>P</div>
            <div><h1 style={{fontSize:16,fontWeight:700,margin:0}}>PaieExpress</h1><p style={{fontSize:11,color:'#94a3b8',margin:0}}>Espace entreprise</p></div>
          </div>
          <nav>
            {[{id:'dashboard',l:'Tableau de bord',i:'🏠'},{id:'entreprise',l:'Mon entreprise',i:'🏢'},{id:'salaries',l:'Salariés',i:'👥'},{id:'bulletins',l:'Bulletins',i:'📄'},{id:'contrats',l:'Contrats',i:'📝'},{id:'attestations',l:'Attestations',i:'📋'},{id:'dsn',l:'DSN',i:'📊'},{id:'conv',l:'Brut/Net',i:'🔄'},{id:'panier',l:`Panier (${panier.length})`,i:'🛒'}].map(n=>(<button key={n.id} onClick={()=>setPage(n.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',border:'none',borderRadius:6,cursor:'pointer',marginBottom:4,fontWeight:500,backgroundColor:page===n.id?C.orange:'transparent',color:page===n.id?C.white:'#94a3b8',textAlign:'left',fontSize:13}}><span>{n.i}</span>{n.l}</button>))}
          </nav>
        </div>
        <div style={{marginTop:'auto',padding:20,borderTop:'1px solid #334155'}}><p style={{fontSize:11,color:'#64748b',marginBottom:8}}>{user?.email}</p><button onClick={logout} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12}}>Déconnexion</button></div>
      </aside>

      <main style={{marginLeft:240,flex:1,padding:28}}>

        {page==='dashboard'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Tableau de bord</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,marginBottom:28}}>
            {[{l:'Salariés',v:sals.length,c:C.darkBlue},{l:'Bulletins',v:bulls.length,c:C.orange},{l:'Ce mois',v:bulls.filter(b=>b.mois===new Date().getMonth()+1).length,c:C.green},{l:'Panier',v:fmt(totPanier),c:C.purple}].map((s,i)=>(<div key={i} style={{...S.card,padding:20}}><div style={{width:40,height:40,backgroundColor:s.c,borderRadius:10,marginBottom:12}}/><p style={{color:C.muted,margin:'0 0 4px',fontFamily:'Inter, sans-serif',fontSize:12}}>{s.l}</p><p style={{fontSize:24,fontWeight:700,margin:0,fontFamily:'Inter, sans-serif'}}>{s.v}</p></div>))}
          </div>
          {!ent&&<div style={{...S.card,padding:28,border:`2px dashed ${C.orange}`,backgroundColor:C.orangeLight}}><h3 style={{color:C.orange,marginBottom:8,fontFamily:'Inter, sans-serif'}}>⚠️ Configurez votre entreprise</h3><p style={{marginBottom:16,fontFamily:'Inter, sans-serif',fontSize:13}}>Recherchez votre entreprise ou saisissez les informations.</p><button onClick={()=>{setFEnt({nom:'',siret:'',adresse:'',cp:'',ville:'',ape:'',taux_at:2.21});setModal('ent')}} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>Configurer</button></div>}
          {ent&&sals.length===0&&<div style={{...S.card,padding:28,border:`2px dashed ${C.green}`,backgroundColor:C.greenLight}}><h3 style={{color:C.green,marginBottom:8,fontFamily:'Inter, sans-serif'}}>👥 Ajoutez vos salariés</h3><p style={{marginBottom:16,fontFamily:'Inter, sans-serif',fontSize:13}}>Créez vos premiers salariés pour générer des bulletins.</p><button onClick={()=>{setPage('salaries');resetFSal();setModal('sal')}} style={{...S.btn,backgroundColor:C.green,color:C.white}}>Ajouter</button></div>}
        </div>)}

        {page==='entreprise'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Mon entreprise</h2>
          {ent?(<div style={{...S.card,padding:24}}><h3 style={{fontSize:18,fontFamily:'Inter, sans-serif',marginBottom:8}}>{ent.nom}</h3><p style={{color:C.muted,marginBottom:4,fontSize:13}}>SIRET: {ent.siret}</p><p style={{color:C.muted,marginBottom:4,fontSize:13}}>APE: {ent.ape}</p><p style={{color:C.muted,marginBottom:16,fontSize:13}}>{ent.adresse}, {ent.cp} {ent.ville}</p><button onClick={()=>{setFEnt(ent);setModal('ent')}} style={{...S.btn,backgroundColor:'#eee',color:C.dark}}>Modifier</button></div>):(<button onClick={()=>{setFEnt({nom:'',siret:'',adresse:'',cp:'',ville:'',ape:'',taux_at:2.21});setModal('ent')}} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>Configurer mon entreprise</button>)}
        </div>)}

        {page==='salaries'&&(<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}><h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,margin:0}}>Salariés ({sals.length})</h2>{ent&&<button onClick={()=>{resetFSal();setModal('sal')}} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>+ Nouveau salarié</button>}</div>
          {!ent?<div style={{...S.card,padding:28,textAlign:'center'}}><p style={{fontFamily:'Inter, sans-serif'}}>Configurez d'abord votre entreprise</p></div>:sals.length===0?<div style={{...S.card,padding:40,textAlign:'center'}}><p style={{fontSize:40,marginBottom:12}}>👥</p><p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600}}>Aucun salarié</p></div>:sals.map(s=>(<div key={s.id} style={{...S.card,padding:16,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,backgroundColor:C.darkBlue,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:C.white,fontWeight:700,fontSize:13}}>{s.prenom?.[0]}{s.nom?.[0]}</div>
              <div><h4 style={{margin:'0 0 2px',fontFamily:'Inter, sans-serif',fontSize:14}}>{s.prenom} {s.nom}</h4><p style={{margin:0,color:C.muted,fontSize:12}}>{s.emploi} • {s.statut}</p><p style={{margin:0,color:C.orange,fontWeight:600,fontSize:13}}>{fmt(s.salaire_brut)} brut</p></div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>{setCurSal(s);setFBull({mois:new Date().getMonth()+1,annee:new Date().getFullYear()});setFVars({hs25:0,hs50:0,primes:0,absJours:0});setModal('genBull')}} style={{...S.btn,backgroundColor:C.orange,color:C.white,padding:'6px 12px',fontSize:11}}>Bulletin</button>
              <button onClick={()=>{setCurSal(s);setFContrat({type:'cdi',duree:6,motif:''});setModal('contrat')}} style={{...S.btn,backgroundColor:C.darkBlue,color:C.white,padding:'6px 12px',fontSize:11}}>Contrat</button>
              <button onClick={()=>{setCurSal(s);setModal('att')}} style={{...S.btn,backgroundColor:C.green,color:C.white,padding:'6px 12px',fontSize:11}}>Attestation</button>
              <button onClick={()=>{setFSal({...s});setEditId(s.id);setModal('sal')}} style={{...S.btn,backgroundColor:'#eee',color:C.dark,padding:'6px 12px',fontSize:11}}>✏️</button>
              <button onClick={()=>delSal(s.id)} style={{...S.btn,padding:'6px 12px',backgroundColor:'#fee',color:C.error,fontSize:11}}>🗑️</button>
            </div>
          </div>))}
        </div>)}

        {page==='bulletins'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Bulletins de paie ({bulls.length})</h2>
          {bulls.length===0?<div style={{...S.card,padding:40,textAlign:'center'}}><p style={{fontSize:40,marginBottom:12}}>📄</p><p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600}}>Aucun bulletin</p></div>:bulls.map(b=>(<div key={b.id} style={{...S.card,padding:16,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,backgroundColor:C.orange,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:C.white,fontSize:20}}>📄</div>
              <div><h4 style={{margin:'0 0 2px',fontFamily:'Inter, sans-serif',fontSize:14}}>{b.salaries?.prenom} {b.salaries?.nom}</h4><p style={{margin:0,color:C.muted,fontSize:12}}>{MOIS[b.mois-1]} {b.annee}</p><span style={{fontSize:11,padding:'2px 8px',borderRadius:99,backgroundColor:b.paye?C.greenLight:C.orangeLight,color:b.paye?C.green:C.orange}}>{b.paye?'✓ Payé':'En attente'}</span></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <p style={{fontSize:20,fontWeight:700,color:C.orange,margin:0}}>{fmt(b.net_a_payer)}</p>
              <button onClick={()=>viewBulletin(b)} style={{...S.btn,backgroundColor:'#eee',color:C.dark,padding:'6px 12px',fontSize:11}}>👁️ Voir</button>
              {!b.paye&&<button onClick={()=>addPanier(b,'bulletin')} style={{...S.btn,padding:'6px 12px',backgroundColor:C.orangeLight,color:C.orange,fontSize:11}}>🛒 {PRIX.bulletin}€</button>}
            </div>
          </div>))}
        </div>)}

        {page==='contrats'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Contrats de travail</h2>
          <div style={{...S.card,padding:28}}><p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600,marginBottom:12}}>Générez des contrats pour vos salariés</p><p style={{color:C.muted,marginBottom:16,fontSize:13}}>Sélectionnez un salarié dans l'onglet "Salariés" puis cliquez sur "Contrat".</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>{[{t:'CDI',d:'Durée indéterminée'},{t:'CDD',d:'Durée déterminée'},{t:'Temps partiel',d:'Horaires réduits'}].map((c,i)=>(<div key={i} style={{padding:20,backgroundColor:C.light,borderRadius:10,textAlign:'center'}}><p style={{fontSize:28,marginBottom:8}}>📝</p><h4 style={{fontFamily:'Inter, sans-serif',fontSize:14}}>{c.t}</h4><p style={{fontSize:12,color:C.muted}}>{c.d}</p><p style={{fontWeight:700,color:C.orange}}>{PRIX.contrat}€</p></div>))}</div></div>
        </div>)}

        {page==='attestations'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Attestations</h2>
          <div style={{...S.card,padding:28}}><p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600,marginBottom:12}}>Générez des attestations pour vos salariés</p><p style={{color:C.muted,marginBottom:16,fontSize:13}}>Sélectionnez un salarié dans l'onglet "Salariés" puis cliquez sur "Attestation".</p></div>
        </div>)}

        {page==='dsn'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Déclaration Sociale Nominative</h2>
          <div style={{...S.card,padding:28}}>
            <p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600,marginBottom:20}}>Générez votre fichier DSN mensuel - GRATUIT</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
              <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Mois</label><select value={fBull.mois} onChange={e=>setFBull({...fBull,mois:parseInt(e.target.value)})} style={S.inp}>{MOIS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
              <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Année</label><select value={fBull.annee} onChange={e=>setFBull({...fBull,annee:parseInt(e.target.value)})} style={S.inp}>{[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
            </div>
            <p style={{color:C.muted,marginBottom:16,fontSize:13}}>Bulletins pour {MOIS[fBull.mois-1]} {fBull.annee}: {bulls.filter(b=>b.mois===fBull.mois&&b.annee===fBull.annee).length}</p>
            <button onClick={dlDSN} style={{...S.btn,backgroundColor:C.green,color:C.white}}>📥 Télécharger DSN</button>
          </div>
        </div>)}

        {page==='conv'&&user&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Convertisseur Brut ↔ Net</h2>
          <div style={{...S.card,padding:28,maxWidth:450}}>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <button onClick={()=>{setConvMode('brut');setConvRes(null)}} style={{...S.btn,flex:1,backgroundColor:convMode==='brut'?C.orange:'#eee',color:convMode==='brut'?C.white:C.dark}}>Brut → Net</button>
              <button onClick={()=>{setConvMode('net');setConvRes(null)}} style={{...S.btn,flex:1,backgroundColor:convMode==='net'?C.orange:'#eee',color:convMode==='net'?C.white:C.dark}}>Net → Brut</button>
            </div>
            <div style={{marginBottom:14}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Salaire {convMode==='brut'?'brut':'net'} (€)</label><input type="number" value={convVal} onChange={e=>setConvVal(e.target.value)} style={S.inp}/></div>
            <div style={{marginBottom:20}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Statut</label><select value={convStat} onChange={e=>setConvStat(e.target.value)} style={S.inp}><option value="non-cadre">Non-cadre</option><option value="cadre">Cadre</option></select></div>
            <button onClick={doConv} style={{...S.btn,backgroundColor:C.green,color:C.white,width:'100%'}}>Calculer</button>
            {convRes&&(<div style={{marginTop:20,padding:16,backgroundColor:C.greenLight,borderRadius:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Brut</span><span style={{fontWeight:700}}>{fmt(convRes.brut)}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Charges</span><span style={{fontWeight:700,color:C.error}}>-{fmt(convRes.charges)}</span></div><div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid #ccc'}}><span style={{fontWeight:700}}>Net</span><span style={{fontWeight:800,fontSize:18,color:C.green}}>{fmt(convRes.net)}</span></div></div>)}
          </div>
        </div>)}

        {page==='panier'&&(<div>
          <h2 style={{fontSize:24,fontFamily:'Inter, sans-serif',fontWeight:700,marginBottom:24}}>Panier ({panier.length})</h2>
          {panier.length===0?<div style={{...S.card,padding:40,textAlign:'center'}}><p style={{fontSize:40,marginBottom:12}}>🛒</p><p style={{fontSize:16,fontFamily:'Inter, sans-serif',fontWeight:600}}>Votre panier est vide</p></div>:(<>
            {panier.map(p=>(<div key={p.id} style={{...S.card,padding:16,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><h4 style={{margin:'0 0 4px',fontFamily:'Inter, sans-serif',fontSize:14}}>{p.type==='bulletin'?'Bulletin de paie':p.type}</h4><p style={{margin:0,color:C.muted,fontSize:12}}>{p.item.salaries?.prenom||p.item.prenom} {p.item.salaries?.nom||p.item.nom}</p></div>
              <div style={{display:'flex',alignItems:'center',gap:14}}><p style={{fontSize:18,fontWeight:700,color:C.orange,margin:0}}>{fmt(p.prix)}</p><button onClick={()=>rmPanier(p.id)} style={{...S.btn,padding:'6px 10px',backgroundColor:'#fee',color:C.error,fontSize:11}}>✕</button></div>
            </div>))}
            <div style={{...S.card,padding:20,marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><span style={{fontSize:18,fontWeight:600}}>Total</span><span style={{fontSize:24,fontWeight:700,color:C.orange}}>{fmt(totPanier)}</span></div>
              <button onClick={payer} style={{...S.btn,backgroundColor:C.green,color:C.white,width:'100%'}}>💳 Payer maintenant</button>
            </div>
          </>)}
        </div>)}
      </main>

      {modal==='pdfPreview'&&pdfUrl&&(<div style={S.modal}>
        <div style={{...S.card,width:'100%',maxWidth:850,height:'85vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:14,borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0,fontSize:16,fontFamily:'Inter, sans-serif'}}>📄 Aperçu du document</h3>
            <div style={{display:'flex',gap:8}}>
              <button onClick={downloadPdf} style={{...S.btn,backgroundColor:C.green,color:C.white,padding:'8px 14px',fontSize:12}}>📥 Télécharger</button>
              <button onClick={closePdf} style={{...S.btn,backgroundColor:'#eee',color:C.dark,padding:'8px 14px',fontSize:12}}>✕ Fermer</button>
            </div>
          </div>
          <div style={{flex:1}}><iframe src={pdfUrl} style={{width:'100%',height:'100%',border:'none'}} title="PDF"/></div>
        </div>
      </div>)}

      {modal==='ent'&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:550,maxHeight:'90vh',overflow:'auto',padding:28}}>
        <h3 style={{fontSize:20,fontFamily:'Inter, sans-serif',marginBottom:20}}>Mon entreprise</h3>
        <div style={{marginBottom:20}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>🔍 Rechercher (SIRET ou nom)</label><input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={S.inp} placeholder="Ex: 12345678900012 ou Ma Société"/>{searchL&&<p style={{color:C.muted,fontSize:12,marginTop:6}}>Recherche...</p>}{searchR.length>0&&<div style={{marginTop:8,border:`1px solid ${C.border}`,borderRadius:6,maxHeight:150,overflow:'auto'}}>{searchR.map((x,i)=>(<button key={i} onClick={()=>selectEnt(x)} style={{width:'100%',padding:10,textAlign:'left',border:'none',borderBottom:`1px solid ${C.border}`,background:'none',cursor:'pointer'}}><p style={{fontWeight:600,margin:'0 0 2px',fontSize:13}}>{x.nom}</p><p style={{fontSize:11,color:C.muted,margin:0}}>{x.siret} • {x.cp} {x.ville}</p></button>))}</div>}</div>
        <form onSubmit={saveEnt}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Raison sociale *</label><input type="text" value={fEnt.nom} onChange={e=>setFEnt({...fEnt,nom:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>SIRET *</label><input type="text" value={fEnt.siret} onChange={e=>setFEnt({...fEnt,siret:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Code APE</label><input type="text" value={fEnt.ape} onChange={e=>setFEnt({...fEnt,ape:e.target.value})} style={S.inp}/></div>
            <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Adresse *</label><input type="text" value={fEnt.adresse} onChange={e=>setFEnt({...fEnt,adresse:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Code postal *</label><input type="text" value={fEnt.cp} onChange={e=>setFEnt({...fEnt,cp:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Ville *</label><input type="text" value={fEnt.ville} onChange={e=>setFEnt({...fEnt,ville:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Taux AT/MP (%)</label><input type="number" step="0.01" value={fEnt.taux_at} onChange={e=>setFEnt({...fEnt,taux_at:e.target.value})} style={S.inp}/></div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:20}}>
            <button type="button" onClick={()=>setModal(null)} style={{...S.btn,backgroundColor:'#eee',color:C.dark}}>Annuler</button>
            <button type="submit" style={{...S.btn,backgroundColor:C.orange,color:C.white}}>Enregistrer</button>
          </div>
        </form>
      </div></div>)}

      {modal==='sal'&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:550,maxHeight:'90vh',overflow:'auto',padding:28}}>
        <h3 style={{fontSize:20,fontFamily:'Inter, sans-serif',marginBottom:20}}>{editId?'Modifier':'Nouveau'} salarié</h3>
        <form onSubmit={saveSal}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Prénom *</label><input type="text" value={fSal.prenom} onChange={e=>setFSal({...fSal,prenom:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Nom *</label><input type="text" value={fSal.nom} onChange={e=>setFSal({...fSal,nom:e.target.value.toUpperCase()})} style={S.inp} required/></div>
            <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>N° Sécurité sociale *</label><input type="text" value={fSal.num_ss} onChange={e=>setFSal({...fSal,num_ss:e.target.value})} style={S.inp} required/></div>
            <div style={{gridColumn:'span 2'}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Adresse *</label><input type="text" value={fSal.adresse} onChange={e=>setFSal({...fSal,adresse:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Code postal *</label><input type="text" value={fSal.cp} onChange={e=>setFSal({...fSal,cp:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Ville *</label><input type="text" value={fSal.ville} onChange={e=>setFSal({...fSal,ville:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Date d'entrée *</label><input type="date" value={fSal.date_entree} onChange={e=>setFSal({...fSal,date_entree:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Emploi *</label><input type="text" value={fSal.emploi} onChange={e=>setFSal({...fSal,emploi:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Statut</label><select value={fSal.statut} onChange={e=>setFSal({...fSal,statut:e.target.value})} style={S.inp}><option value="non-cadre">Non-cadre</option><option value="cadre">Cadre</option></select></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Heures/mois</label><input type="number" step="0.01" value={fSal.heures} onChange={e=>setFSal({...fSal,heures:e.target.value})} style={S.inp}/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Salaire brut € *</label><input type="number" step="0.01" value={fSal.salaire_brut} onChange={e=>setFSal({...fSal,salaire_brut:e.target.value})} style={S.inp} required/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Taux PAS %</label><input type="number" step="0.1" value={fSal.taux_pas} onChange={e=>setFSal({...fSal,taux_pas:e.target.value})} style={S.inp}/></div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:20}}>
            <button type="button" onClick={()=>{setModal(null);setEditId(null)}} style={{...S.btn,backgroundColor:'#eee',color:C.dark}}>Annuler</button>
            <button type="submit" style={{...S.btn,backgroundColor:C.orange,color:C.white}}>{editId?'Modifier':'Créer'}</button>
          </div>
        </form>
      </div></div>)}

      {modal==='genBull'&&curSal&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:450,padding:28}}>
        <h3 style={{fontSize:20,fontFamily:'Inter, sans-serif',marginBottom:8}}>Générer un bulletin</h3>
        <p style={{color:C.muted,marginBottom:20,fontSize:13}}>{curSal.prenom} {curSal.nom} - {fmt(curSal.salaire_brut)} brut</p>
        <form onSubmit={genBull}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Mois</label><select value={fBull.mois} onChange={e=>setFBull({...fBull,mois:parseInt(e.target.value)})} style={S.inp}>{MOIS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Année</label><select value={fBull.annee} onChange={e=>setFBull({...fBull,annee:parseInt(e.target.value)})} style={S.inp}>{[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:20}}>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:11}}>HS 25%</label><input type="number" value={fVars.hs25} onChange={e=>setFVars({...fVars,hs25:e.target.value})} style={S.inp}/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:11}}>HS 50%</label><input type="number" value={fVars.hs50} onChange={e=>setFVars({...fVars,hs50:e.target.value})} style={S.inp}/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:11}}>Primes €</label><input type="number" value={fVars.primes} onChange={e=>setFVars({...fVars,primes:e.target.value})} style={S.inp}/></div>
            <div><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:11}}>Abs. jours</label><input type="number" value={fVars.absJours} onChange={e=>setFVars({...fVars,absJours:e.target.value})} style={S.inp}/></div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
            <button type="button" onClick={()=>setModal(null)} style={{...S.btn,backgroundColor:'#eee',color:C.dark}}>Annuler</button>
            <button type="submit" style={{...S.btn,backgroundColor:C.orange,color:C.white}}>Générer & Aperçu</button>
          </div>
        </form>
      </div></div>)}

      {modal==='contrat'&&curSal&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:450,padding:28}}>
        <h3 style={{fontSize:20,fontFamily:'Inter, sans-serif',marginBottom:8}}>Générer un contrat</h3>
        <p style={{color:C.muted,marginBottom:20,fontSize:13}}>{curSal.prenom} {curSal.nom}</p>
        <div style={{marginBottom:14}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Type de contrat</label><select value={fContrat.type} onChange={e=>setFContrat({...fContrat,type:e.target.value})} style={S.inp}><option value="cdi">CDI - Durée indéterminée</option><option value="cdd">CDD - Durée déterminée</option><option value="partiel">Temps partiel</option></select></div>
        {fContrat.type==='cdd'&&(<><div style={{marginBottom:14}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Durée (mois)</label><input type="number" value={fContrat.duree} onChange={e=>setFContrat({...fContrat,duree:e.target.value})} style={S.inp}/></div><div style={{marginBottom:14}}><label style={{display:'block',fontWeight:600,marginBottom:8,fontSize:13}}>Motif</label><select value={fContrat.motif} onChange={e=>setFContrat({...fContrat,motif:e.target.value})} style={S.inp}><option>Accroissement temporaire d'activité</option><option>Remplacement d'un salarié absent</option><option>Emploi saisonnier</option></select></div></>)}
        <p style={{backgroundColor:C.orangeLight,padding:12,borderRadius:6,marginBottom:20,fontSize:13}}>💰 Prix: <strong>{PRIX.contrat}€</strong></p>
        <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
          <button onClick={()=>setModal(null)} style={{...S.btn,backgroundColor:'#eee',color:C.dark}}>Annuler</button>
          <button onClick={previewContrat} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>👁️ Voir l'aperçu</button>
        </div>
      </div></div>)}

      {modal==='att'&&curSal&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:450,padding:28}}>
        <h3 style={{fontSize:20,fontFamily:'Inter, sans-serif',marginBottom:8}}>Générer une attestation</h3>
        <p style={{color:C.muted,marginBottom:20,fontSize:13}}>{curSal.prenom} {curSal.nom}</p>
        <div style={{display:'grid',gap:12,marginBottom:20}}>
          <button onClick={()=>previewAtt('travail')} style={{...S.btn,backgroundColor:C.light,color:C.dark,justifyContent:'flex-start',padding:14}}><span style={{marginRight:10}}>📋</span><div style={{textAlign:'left'}}><p style={{fontWeight:600,margin:0,fontSize:13}}>Attestation de travail</p><p style={{fontSize:11,color:C.muted,margin:0}}>Certifie l'emploi actuel</p></div></button>
          <button onClick={()=>previewAtt('employeur')} style={{...S.btn,backgroundColor:C.light,color:C.dark,justifyContent:'flex-start',padding:14}}><span style={{marginRight:10}}>📋</span><div style={{textAlign:'left'}}><p style={{fontWeight:600,margin:0,fontSize:13}}>Attestation employeur</p><p style={{fontSize:11,color:C.muted,margin:0}}>Usage administratif</p></div></button>
          <button onClick={()=>previewAtt('certificat')} style={{...S.btn,backgroundColor:C.light,color:C.dark,justifyContent:'flex-start',padding:14}}><span style={{marginRight:10}}>📋</span><div style={{textAlign:'left'}}><p style={{fontWeight:600,margin:0,fontSize:13}}>Certificat de travail</p><p style={{fontSize:11,color:C.muted,margin:0}}>Fin de contrat</p></div></button>
        </div>
        <p style={{backgroundColor:C.orangeLight,padding:12,borderRadius:6,marginBottom:14,fontSize:13}}>💰 Prix: <strong>{PRIX.attestation}€</strong> par attestation</p>
        <button onClick={()=>setModal(null)} style={{...S.btn,backgroundColor:'#eee',color:C.dark,width:'100%'}}>Fermer</button>
      </div></div>)}

      {modal==='payOk'&&(<div style={S.modal}><div style={{...S.card,width:'100%',maxWidth:380,padding:40,textAlign:'center'}}>
        <div style={{width:70,height:70,backgroundColor:C.greenLight,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:32}}>✓</div>
        <h3 style={{fontSize:22,fontFamily:'Inter, sans-serif',color:C.green,marginBottom:12}}>Paiement réussi !</h3>
        <p style={{color:C.muted,marginBottom:20,fontSize:14}}>Vos documents sont maintenant disponibles.</p>
        <button onClick={()=>{setModal(null);setPage('bulletins')}} style={{...S.btn,backgroundColor:C.orange,color:C.white}}>Voir mes documents</button>
      </div></div>)}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
