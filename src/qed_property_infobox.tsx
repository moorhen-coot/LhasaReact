import { LinearProgress, Tabs, Tab } from '@mui/material';
import type { QEDInfo } from './types';

type QedPropertyInfoboxProps = {
    property_name: string;
    display_value: string | number | undefined;
    progressbar_value: number | undefined;
};

type QEDTabsProps = {
    qedInfo: Map<number, QEDInfo>;
    currentTab: number;
    onTabChange: (value: number) => void;
};

export function QedPropertyInfobox(props: QedPropertyInfoboxProps) {
    return <span className="qed_property_field">
        <span className="qed_property_label">{props.property_name}</span>
        <span className="qed_property_value">{props.display_value}</span>
        {props.progressbar_value && <LinearProgress variant="determinate" value={props.progressbar_value * 100} />}
    </span>;
}

export function QEDTabs(props: QEDTabsProps) {
    const { qedInfo, currentTab, onTabChange } = props;

    if (!qedInfo || qedInfo.size === 0) {
        return null;
    }

    const isSingleTab = qedInfo.size === 1;
    
    return (
        <>
            {!isSingleTab && (
                // This is the tab list (only shows when there are multiple tabs)
                <Tabs value={currentTab} onChange={(_event, value) => onTabChange(value)}>
                    {Array.from(qedInfo.keys()).map((mol_id) => (
                        // Counter-intuitively, a "Tab" here is what Gtk considers to be a tab label
                        <Tab 
                            key={mol_id}
                            label={mol_id.toString()}
                            value={mol_id}
                        />
                    ))}
                </Tabs>
            )}
            {Array.from(qedInfo.keys()).map((mol_id) => {
                // This is the proper tab
                return <div hidden={!isSingleTab && currentTab !== mol_id} key={mol_id}>
                    <div className="horizontal_container">
                        <div className="vertical_panel" style={{flexGrow: 1}}>
                            <QedPropertyInfobox 
                                property_name='QED score:'
                                display_value={qedInfo.get(mol_id)?.qed_score.toFixed(4)}
                                progressbar_value={qedInfo.get(mol_id)?.qed_score}
                            />
                            <QedPropertyInfobox 
                                property_name='MW'
                                display_value={qedInfo.get(mol_id)?.molecular_weight.toFixed(4)}
                                progressbar_value={qedInfo.get(mol_id)?.ads_mw}
                            />
                            <QedPropertyInfobox 
                                property_name='PSA'
                                display_value={qedInfo.get(mol_id)?.molecular_polar_surface_area.toFixed(4)}
                                progressbar_value={qedInfo.get(mol_id)?.ads_psa}
                            />
                        </div>
                        <div className="vertical_panel" style={{flexGrow: 1}}>  
                            <QedPropertyInfobox 
                                property_name='cLogP'
                                display_value={ qedInfo.get(mol_id)?.alogp.toFixed(4)}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_alogp}
                            />
                            <QedPropertyInfobox 
                                property_name='#ALERTS'
                                display_value={ qedInfo.get(mol_id)?.number_of_alerts}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_alert}
                            />
                            <QedPropertyInfobox 
                                property_name='#HBA'
                                display_value={ qedInfo.get(mol_id)?.number_of_hydrogen_bond_acceptors}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_hba}
                            />
                        </div>
                        <div className="vertical_panel" style={{flexGrow: 1}}>    
                            <QedPropertyInfobox 
                                property_name='#HBD'
                                display_value={ qedInfo.get(mol_id)?.number_of_hydrogen_bond_donors}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_hbd}
                            />
                            <QedPropertyInfobox 
                                property_name='#AROM'
                                display_value={ qedInfo.get(mol_id)?.number_of_aromatic_rings}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_arom}
                            />
                            <QedPropertyInfobox 
                                property_name='#RotBonds'
                                display_value={ qedInfo.get(mol_id)?.number_of_rotatable_bonds}
                                progressbar_value={ qedInfo.get(mol_id)?.ads_rotb}
                            />
                        </div>
                    </div>
                </div>;
            })}
        </>
    );
}