import { LinearProgress } from '@mui/material';
class QedPropertyInfoboxProps {
    property_name!: string;
    display_value: string | number | undefined;
    progressbar_value: number | undefined;
}

export function QedPropertyInfobox(props: QedPropertyInfoboxProps) {
    return <span className="qed_property_field">
        <span className="qed_property_label">{props.property_name}</span>
        <span className="qed_property_value">{props.display_value}</span>
        {props.progressbar_value && <LinearProgress variant="determinate" value={props.progressbar_value * 100} />}
    </span>;
}