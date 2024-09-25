import css from './style.module.css';



interface TabsProps {
    tabs: [string, string][];
    value: string;
    onTabChange: (value: string) => void;
}

const Tabs = (props:TabsProps) => {
    const {tabs, value, onTabChange} = props;
    return (
        <div className={css.container}>
            {tabs.map(([label, code]) => { 
                return (code === value) ? (
                        <div key={code} className={`${css.itemActived} ${css.item}`}>
                            <span className={css.titleSection}>{label}</span>
                        </div>
                    ):(
                        <div key={code} className={`${css.itemNoActived} ${css.item}`}>
                            <span className={css.titleSection}  onClick={() => onTabChange(code)}>{label}</span>
                        </div>
                    );
                })}
        </div>
    );
}   

export default Tabs;