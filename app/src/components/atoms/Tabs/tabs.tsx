import type { KeyboardEvent } from 'react';
import css from './style.module.css';

interface TabsProps {
  tabs: [string, string][];
  value: string;
  onTabChange: (value: string) => void;
  idPrefix?: string;
}

export default function Tabs({ tabs, value, onTabChange, idPrefix = 'tabs' }: TabsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex(([, code]) => code === value);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    onTabChange(tabs[next][1]);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${idPrefix}-${tabs[next][1]}`)?.focus();
  }
  return <div className={css.container} role="tablist" aria-label="Field editor sections" onKeyDown={onKeyDown}>
    {tabs.map(([label, code]) => <button key={code} type="button" role="tab"
      id={`${idPrefix}-${code}`} aria-controls={`${idPrefix}-${code}-panel`}
      aria-selected={code === value} tabIndex={code === value ? 0 : -1}
      className={`${css.item} ${code === value ? css.itemActived : css.itemNoActived}`}
      onClick={() => onTabChange(code)}>{label}</button>)}
  </div>;
}
