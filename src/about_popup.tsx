import { Popover, Button } from "@mui/material";

import './index.scss';
import './customize_mui.scss';

class AboutPopupProps {
    dark_mode!: boolean;
    icons_path_prefix!: string;
    open!: boolean;
    anchorEl?: HTMLElement | null;
    onClose!: () => void;
}

export function AboutPopup(props: AboutPopupProps) {
    return (
        <Popover
            open={props.open}
            anchorEl={props.anchorEl}
            anchorOrigin={{vertical: 'center', horizontal: 'center'}}
            transformOrigin={{vertical: 'center', horizontal: 'center'}}
            onClose={props.onClose}
            className={"LhasaMuiStyling" + (props.dark_mode ? " lhasa_dark_mode" : "")}
        >
            <div className={"vertical_popup lhasa_editor LhasaMuiStyling" + (props.dark_mode ? " lhasa_dark_mode" : "")}>
                <div className="vertical_popup_title">About Lhasa</div>
                <div>
                    <img src={props.icons_path_prefix + "/icons/hicolor_apps_scalable_coot-layla.svg"} style={{display: "block", margin: "0 auto", padding: "20px"}} />
                    <p>
                        Lhasa is the web (React.JS + WebAssembly) port of Layla — Coot's Ligand Builder.
                    </p>
                    <div>
                        <p>
                            <b>Frontend sources: <a href="https://github.com/moorhen-coot/LhasaReact">Lhasa repository</a></b>
                        </p>
                        <p>
                            <b>WebAssembly sources: <a href="https://github.com/pemsley/coot/tree/main/lhasa">Coot repository</a></b>
                        </p>
                    </div>
                    <div>
                        <b>Credits</b>
                        <div>
                            <ul>
                                <li>Jakub Smulski</li>
                                <li>Filomeno Sanchez-Rodriguez</li>
                                <li>Clement Degut</li>
                            </ul>
                        </div>
                    </div>
                    <p>
                        <b>Contact:</b> Jakub Smulski &lt;<a href="mailto:quicillith17@tutamail.com">quicillith17@tutamail.com</a>&gt;
                    </p>
                    <p>
                        <b>License:</b> GPL v3
                    </p>
                    {/* TODO: Add version info */}
                    <p>Copyright &copy; Global Phasing Ltd. 2024 - 2026</p>
                    <Button variant="outlined" onClick={props.onClose}>Close</Button>
                </div>
            </div>
        </Popover>
    );
}
