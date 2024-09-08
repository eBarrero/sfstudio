import css from './style.module.css';


/* SVG library */

type SVGIcons = string | 'NOTFOUND' | 'search' | 'reference' | '1toN' | '1to1' | 'add' | 'save' | 'cancel' | 'close' | 'menu' | 'more' | 'filter' | 'sort' | 'download' | 'upload' | 'print' | 'refresh' | 'settings' | 'help' | 'info' | 'warning' | 'error' | 'success' | 'notification' | 'notification-off' | 'notification-on' | 'notification-error' | 'notification-success' | 'notification-warning' | 'notification-info' | 'notification-question' | 'notification-alert'



    /* fill-rule: Define la regla que se utiliza para determinar qué partes de la geometría de un trazado se consideran el interior de la forma.
    nonzero: La regla de no cero. Cuenta el número de veces que una línea cruza el trazado. Si este número es impar, el punto está dentro de la forma. Si es par, el punto está fuera de la forma.
    evenodd: La regla par-impar. Divide el trazado en segmentos y cuenta el número de veces que cada segmento cruza el trazado. Un punto está dentro de la forma si el número de segmentos que cruza es impar. */
type fill_rule_type = "nonzero" | "evenodd"  

    /* stroke-linecap: Define la forma de los extremos de una línea.
    butt: Los extremos de las líneas son planos.
    round: Los extremos de las líneas son redondeados.
    square: Los extremos de las líneas son cuadrados. */
 type stroke_linecap_type = "butt" | "round" | "square"

    /* Define cómo se unen dos segmentos de línea (cuando se encuentran en un ángulo) o dos segmentos de línea curva (cuando se encuentran en un punto final común).
    miter: Extiende la línea para que se una en un punto más allá del final de las líneas. Esto es el valor predeterminado.
    round: Extiende la línea para que se una en un arco redondeado más allá del final de las líneas.
    bevel: Extiende la línea para que se una en un ángulo recto más allá del final de las líneas. */
 type stroke_linejoin_type = "miter" | "round" | "bevel"

interface SVGPaths {
    d : string
    fill_rule?: fill_rule_type
    clip_rule?: fill_rule_type
    stroke_width?: number
    stroke_linecap?: stroke_linecap_type
    stroke_linejoin?: stroke_linejoin_type
}

class DefaultPaths implements SVGPaths {
    d: string;
    fill_rule: fill_rule_type;
    clip_rule: fill_rule_type;
    stroke_width: number;
    stroke_linecap: stroke_linecap_type;
    stroke_linejoin: stroke_linejoin_type;
    constructor(path:SVGPaths)   {
        this.d = path.d;
        this.fill_rule = path.fill_rule || 'nonzero';
        this.clip_rule = path.clip_rule || 'nonzero';
        this.stroke_width = path.stroke_width || 1;
        this.stroke_linecap = path.stroke_linecap || 'butt';
        this.stroke_linejoin = path.stroke_linejoin || 'miter';
    }
}

const MapSVG = new Map<SVGIcons, DefaultPaths[]>;

MapSVG.set('NOTFOUND', [ 
    new DefaultPaths({
        d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z", 
        fill_rule: "evenodd", 
        clip_rule: "evenodd"
    })
]);

MapSVG.set('search', [
    new DefaultPaths({
        d: "M18.319 14.4326C20.7628 11.2941 20.542 6.75347 17.6569 3.86829C14.5327 0.744098 9.46734 0.744098 6.34315 3.86829C3.21895 6.99249 3.21895 12.0578 6.34315 15.182C9.22833 18.0672 13.769 18.2879 16.9075 15.8442C16.921 15.8595 16.9351 15.8745 16.9497 15.8891L21.1924 20.1317C21.5829 20.5223 22.2161 20.5223 22.6066 20.1317C22.9971 19.7412 22.9971 19.1081 22.6066 18.7175L18.364 14.4749C18.3493 14.4603 18.3343 14.4462 18.319 14.4326ZM16.2426 5.28251C18.5858 7.62565 18.5858 11.4246 16.2426 13.7678C13.8995 16.1109 10.1005 16.1109 7.75736 13.7678C5.41421 11.4246 5.41421 7.62565 7.75736 5.28251C10.1005 2.93936 13.8995 2.93936 16.2426 5.28251Z", 
        fill_rule: "evenodd", 
        clip_rule: "evenodd"
    })
]);

MapSVG.set('reference', [
    new DefaultPaths({d: "M14 13.9633H16V7.96331H10V9.96331H12.5858L7.25623 15.2929L8.67044 16.7071L14 11.3775V13.9633Z"}), 
    new DefaultPaths({d: "M23 19C23 21.2091 21.2091 23 19 23H5C2.79086 23 1 21.2091 1 19V5C1 2.79086 2.79086 1 5 1H19C21.2091 1 23 2.79086 23 5V19ZM19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21Z"}) 
]);


MapSVG.set('1toN', [
    new DefaultPaths({d:"M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z",
        stroke_width:1.5,
        stroke_linecap:"round",
        stroke_linejoin:"round"}),
    new DefaultPaths({d:"M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z",
         stroke_width:1.5,
         stroke_linecap:"round",
         stroke_linejoin:"round"}),
    new DefaultPaths({d:"M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z",
        stroke_width:1.5,
        stroke_linecap:"round",
        stroke_linejoin:"round"}),
    new DefaultPaths({d:"M15.5 6.5L8.5 10.5",
        stroke_width:1.5}),
    new DefaultPaths({d:"M8.5 13.5L15.5 17.5",
        stroke_width:1.5})
]);
    
MapSVG.set('1to1', [
    new DefaultPaths({d:"M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14Z",
        stroke_width:1.7,
        stroke_linecap:"round",
        stroke_linejoin:"round"}),
    new DefaultPaths({d:"M9 12H22M22 12L19 9M22 12L19 15",
        stroke_width:1.7,
        stroke_linecap:"round",
        stroke_linejoin:"round"}),
]);             




interface IconProps {
    iconType: SVGIcons 
    tooltip: string | undefined
}

const SVGIcon: React.FC<IconProps> = ({tooltip ,iconType}) => {
    
    const paths = (!MapSVG.has(iconType))? MapSVG.get('NOTFOUND') :  MapSVG.get(iconType);

    return (
        <div className={`${css.container} ${css.size_small}`}>
            <svg  className={css.svgIcon} 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            >
            {paths!.map((path, index) => (
                <path key={index} d={path.d} 
                    strokeWidth={path.stroke_width} 
                    strokeLinecap={path.stroke_linecap}
                    strokeLinejoin={path.stroke_linejoin}
                    fillRule={path.fill_rule} 
                    clipRule={path.clip_rule} 
                    />       
            ))}
            </svg>
            {tooltip != undefined &&  <span className={css.tooltip}>{tooltip}</span>}
        </div>
    );
}

export default SVGIcon;




