import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {CalendarDays, ChevronLeft, ChevronRight, X} from 'lucide-react';
import './premium-date-picker.css';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dateValue = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseDate = value => value ? new Date(`${value}T12:00:00`) : new Date();

export default function PremiumDatePicker({name, required=false, disabled=false, min, max, defaultValue='', label='Select date'}) {
  const id = useId();
  const input = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDate(defaultValue));
  const [position, setPosition] = useState({left:16, top:16, width:320});
  const today = dateValue(new Date());
  const year = month.getFullYear();
  const firstDay = (new Date(year,month.getMonth(),1).getDay()+6)%7;
  const dayCount = new Date(year,month.getMonth()+1,0).getDate();
  const allowed = date => (!min || date >= min) && (!max || date <= max);

  function show() { if (!disabled) { setMonth(parseDate(value)); setOpen(true); } }
  function close() { setOpen(false); trigger.current?.focus({preventScroll:true}); }
  function choose(date) {
    setValue(date);
    // Keep the existing form field, ISO date value and native constraint validation.
    input.current.value = date;
    input.current.dispatchEvent(new Event('input',{bubbles:true}));
    input.current.dispatchEvent(new Event('change',{bubbles:true}));
    close();
  }
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { setValue(defaultValue); setOpen(false); };
    form?.addEventListener('reset',reset);
    return () => form?.removeEventListener('reset',reset);
  }, [defaultValue]);
  useLayoutEffect(() => {
    if (!open) return;
    const bounds = trigger.current.getBoundingClientRect();
    const width = Math.min(328,window.innerWidth-32);
    const height = panel.current?.offsetHeight || 380;
    setPosition({width, left:Math.max(16,Math.min(bounds.left,window.innerWidth-width-16)), top:Math.max(16,Math.min(bounds.bottom+10+height<=window.innerHeight-16 ? bounds.bottom+10 : bounds.top-height-10,window.innerHeight-height-16))});
    const frame = requestAnimationFrame(() => panel.current?.querySelector(`[data-date="${value || today}"]`)?.focus({preventScroll:true}));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    const dismiss = event => { if (!panel.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown',outside);
    window.addEventListener('resize',dismiss);
    window.addEventListener('scroll',dismiss,true);
    return () => { document.removeEventListener('pointerdown',outside); window.removeEventListener('resize',dismiss); window.removeEventListener('scroll',dismiss,true); };
  }, [open]);

  function keyboard(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    const date = event.target.dataset.date;
    if (!date) return;
    const shifts = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
    if (!(event.key in shifts)) return;
    event.preventDefault();
    const next = parseDate(date); next.setDate(next.getDate()+shifts[event.key]);
    const nextValue = dateValue(next);
    if (!allowed(nextValue)) return;
    setMonth(new Date(next.getFullYear(),next.getMonth(),1));
    requestAnimationFrame(() => panel.current?.querySelector(`[data-date="${nextValue}"]`)?.focus());
  }
  return <span className="premium-date-field">
    <input ref={input} className="premium-date-native" type="date" name={name} value={value} required={required} disabled={disabled} min={min} max={max} tabIndex={-1}
      onChange={event => setValue(event.target.value)} onInvalid={event => { event.preventDefault(); show(); }}/>
    <button ref={trigger} className={`premium-date-trigger${value ? ' has-date' : ''}`} type="button" disabled={disabled}
      aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => open ? close() : show()}>
      <span>{value ? parseDate(value).toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'}) : 'Select a date'}</span><CalendarDays size={19} aria-hidden="true"/>
    </button>
    {open && createPortal(<div ref={panel} id={id} className="premium-calendar" role="dialog" aria-label={`${label} calendar`} style={position} onKeyDown={keyboard}>
      <div className="premium-calendar-title"><span><CalendarDays size={17} aria-hidden="true"/>SELECT DATE</span><button type="button" aria-label="Close calendar" onClick={close}><X size={17}/></button></div>
      <div className="premium-calendar-navigation">
        <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(year,month.getMonth()-1,1))}><ChevronLeft size={18}/></button>
        <div><select aria-label="Calendar month" value={month.getMonth()} onChange={event => setMonth(new Date(year,Number(event.target.value),1))}>{months.map((text,index) => <option key={text} value={index}>{text}</option>)}</select>
          <select aria-label="Calendar year" value={year} onChange={event => setMonth(new Date(Number(event.target.value),month.getMonth(),1))}>{Array.from({length:201},(_,index) => year-100+index).map(option => <option key={option}>{option}</option>)}</select></div>
        <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(year,month.getMonth()+1,1))}><ChevronRight size={18}/></button>
      </div>
      <div className="premium-calendar-weekdays">{['Mo','Tu','We','Th','Fr','Sa','Su'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="premium-calendar-days">
        {Array.from({length:firstDay},(_,index) => <span key={`blank-${index}`}/>)}
        {Array.from({length:dayCount},(_,index) => { const day=index+1; const date=dateValue(new Date(year,month.getMonth(),day)); return <button key={date} type="button" data-date={date} disabled={!allowed(date)} aria-label={parseDate(date).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})} aria-pressed={value===date} className={`${value===date ? 'is-selected' : ''} ${date===today ? 'is-today' : ''}`} onClick={() => choose(date)}>{day}</button>; })}
      </div>
      <div className="premium-calendar-footer"><button type="button" onClick={() => choose('')}>Clear</button><button type="button" disabled={!allowed(today)} onClick={() => choose(today)}>Today</button></div>
    </div>,document.body)}
  </span>;
}
