import React, {useEffect, useId, useRef, useState} from 'react';
import {ChevronDown} from 'lucide-react';

export default function VictoriaAddressInput() {
  const id = useId();
  const root = useRef(null);
  const [value, setValue] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [visibleCount, setVisibleCount] = useState(60);
  useEffect(() => {
    if (!open) return;
    const query = value === selected ? '' : value.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setMessage('Searching addresses…');
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {signal:controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error();
        if (controller.signal.aborted) return;
        setResults(data.results || []);
        setActive(-1);
        setVisibleCount(60);
        setMessage(data.results?.length ? '' : 'No matches found. You can enter your address manually.');
      } catch {
        if (!controller.signal.aborted) { setResults([]); setMessage('Suggestions unavailable. Please enter your address manually.'); }
      }
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, selected, open]);
  function choose(result) { setValue(result.label); setSelected(result.label); setOpen(false); setResults([]); setMessage(''); }
  return <div ref={root} className="application-address" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>Enter your Address</label>
    <div className="application-address-control">
    <input id={id} name="location" value={value} autoComplete="off" placeholder="Select or search your suburb / area in Victoria"
      role="combobox" aria-autocomplete="list" aria-expanded={open && results.length > 0} aria-controls={`${id}-options`}
      aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
      onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={event => { setValue(event.target.value); setSelected(''); setResults([]); setActive(-1); setOpen(true); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); return; }
        if (!results.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => { const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length; setVisibleCount(count => Math.max(count, next + 1)); requestAnimationFrame(() => document.getElementById(`${id}-option-${next}`)?.scrollIntoView({block:'nearest'})); return next; }); }
        if (event.key === 'Enter' && open && active >= 0) { event.preventDefault(); choose(results[active]); }
      }}/>
      <button type="button" className="application-address-toggle" aria-label={open ? 'Close Victoria areas' : 'Show Victoria areas'} aria-expanded={open} aria-controls={`${id}-options`} onClick={() => setOpen(!open)}><ChevronDown size={20} aria-hidden="true"/></button>
    </div>
    {open && results.length > 0 && <ul id={`${id}-options`} role="listbox" className="application-address-options" onScroll={event => { const list=event.currentTarget; if (list.scrollHeight-list.scrollTop-list.clientHeight < 80) setVisibleCount(count => Math.min(count+60, results.length)); }}>
      {results.slice(0,visibleCount).map((result, index) => <li id={`${id}-option-${index}`} key={result.label} role="option" aria-selected={active === index}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(result)}>{result.label}</li>)}
      <li className="application-address-credit" role="presentation">{results.length} areas / addresses · <a href="https://discover.data.vic.gov.au/dataset/vicmap-admin" target="_blank" rel="noreferrer">© State of Victoria (Vicmap)</a> · © OpenStreetMap contributors</li>
    </ul>}
    {open && message && <small className="application-address-message" role="status">{message}</small>}
  </div>;
}
