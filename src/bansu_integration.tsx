import { Popover, Button, Tooltip, StyledEngineProvider, AccordionSummary, AccordionDetails, Accordion, Input, Checkbox, FormControlLabel, Switch, Select, MenuItem } from "@mui/material";
// import Grid from '@mui/material/Grid2';
import { useCallback, useEffect, useRef, useState } from "react";
// import WebSocket from 'ws';
// import * as http from 'http';

// Do I really need that here?
import './index.scss';
import './customize_mui.scss';

class BansuPopupProps {
    /// List of molecules on the canvas: [internal molecule ID, ID from prop (or null if not initialized from prop), SMILES string].
    smiles_list!: [number, string | null, string][];
    anchorEl?: HTMLElement | null;
    bansu_endpoint!: string;
    dark_mode!: boolean;
    bansu_callback?: (internal_id: number, id_from_prop: string | null, cif_text: string) => void;
    name_of_host_program?: string | null;
}

// Do I want to use an enum?
// Or do I way to express the state with variables alone?
enum BansuPopupState {
    UserConfig,
    SpawningJob,
    ConnectingOnWebsocket,
    Queued,
    Waiting,
    Ready,
    Error
}

export function BansuButton(props: BansuPopupProps) {

    const [popoverOpened, setPopoverOpened] = useState<boolean>(false);
    const [userConsent, setUserConsent] = useState<boolean>(false);
    const [state, setState] = useState<BansuPopupState>(BansuPopupState.UserConfig);
    const [bansuEndpoint, setBansuEndpoint] = useState<string>(props.bansu_endpoint);
    const [jobId, setJobId] = useState<string | null>(null);
    const [posInQueue, setPosInQueue] = useState<number | null>(null);
    const [finishedJobOutput, setFinishedJobOutput] = useState<string | null>(null);
    const [errorString, setErrorString] = useState<string | null>(null);

    const [acedrgFlagP, setAcedrgFlagP] = useState<boolean>(false);
    const [acedrgFlagZ, setAcedrgFlagZ] = useState<boolean>(false);

    const [selectedMolIndex, setSelectedMolIndex] = useState<number>(0);

    // Trigger for the spawn effect. Incremented (not watched by value) so that
    // intermediate setState calls inside the async pipeline don't re-fire (and thus don't cleanup) the effect.
    const [spawnCounter, setSpawnCounter] = useState<number>(0);

    const abortRef = useRef<AbortController | null>(null);

    const cancelJob = () => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setState(BansuPopupState.UserConfig);
    };

    const resetState = () => {
        setState(BansuPopupState.UserConfig);
    }

    const popoverContent = useCallback(() => {
        if(!popoverOpened) {
            return <></>;
        }
        switch(state) {
            case BansuPopupState.UserConfig:
                return <div className="vertical_panel">
                    Bansu is a server-side computational API which enables CIF generation via running Acedrg.
                    <div className="warning_box">
                        <h2>WARNING!</h2>
                        <b>Usage of non-local instances of Bansu implies that your data will travel across the web to a remote webserver.</b><br/>
                        <b>Make sure that you're using an HTTPS endpoint</b> for transport security.<br/>
                        While Bansu does not store logs containing chemical data, please note that<br/><b>by using a remote instance of Bansu you're trusting the instance's owner with your data.</b><br/>
                        <br/>
                        <FormControlLabel 
                            label="I understand and agree to proceed"
                            control={
                            <Checkbox 
                                style={{marginLeft: '5px'}}
                                checked={userConsent}
                                onChange={() => setUserConsent(!userConsent)}
                            />} 
                        />
                    </div>
                    <b>Bansu job configuration</b>
                    <div className="horizontal_container_centered">
                        Molecule
                        <Select
                            // size="small"
                            value={Math.min(selectedMolIndex, props.smiles_list.length - 1)}
                            onChange={(event) => setSelectedMolIndex(event.target.value as number)}
                            disabled={props.smiles_list.length <= 1}
                            // This appears to fix alignment of text in the drop-down
                            className={"LhasaMuiStyling" + (props.dark_mode ? " lhasa_dark_mode" : "")}
                            MenuProps={{ className: "LhasaMuiStyling" + (props.dark_mode ? " lhasa_dark_mode" : "") }}
                            style={{flex: 1}}
                        >
                            {props.smiles_list.map(([_molId, _idFromProp, smilesStr], index) => (
                                <MenuItem key={index} value={index}>{smilesStr}</MenuItem>
                            ))}
                        </Select>
                    </div>
                    <div className="horizontal_container_centered children_expanded" >
                        Bansu instance
                        <Input defaultValue={bansuEndpoint} placeholder={props.bansu_endpoint} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            if(event.target.value !== "") {
                                setBansuEndpoint(event.target.value);
                            } else {
                                setBansuEndpoint(props.bansu_endpoint);
                            }
                        }}
                        />
                    </div>
                    Acedrg commandline flags
                    <div className="vertical_panel">
                        <FormControlLabel
                            label="-p: Use existing coordinates"
                            control={
                                <Switch
                                    style={{marginLeft: '5px'}}
                                    checked={acedrgFlagP}
                                    onChange={() => setAcedrgFlagP(!acedrgFlagP)}
                                />
                            }
                        />
                        <FormControlLabel
                            label="-z: No geometry optimization"
                            control={
                                <Switch
                                    style={{marginLeft: '5px'}}
                                    checked={acedrgFlagZ}
                                    onChange={() => setAcedrgFlagZ(!acedrgFlagZ)}
                                />
                            }
                        />
                    </div>
                    <div className="horizontal_container_centered children_expanded">
                        <Button 
                            onClick={() => setPopoverOpened(false)}
                            variant="contained"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => { setState(BansuPopupState.SpawningJob); setSpawnCounter(c => c + 1); }}
                            variant="contained"
                            disabled={!userConsent}
                        >
                            Spawn Bansu job
                        </Button>
                    </div>
                </div>;
            case BansuPopupState.SpawningJob:
                return <div className="vertical_panel">
                    Spawning Bansu job...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <Button onClick={cancelJob} variant="contained">Cancel</Button>
                </div>;
            case BansuPopupState.ConnectingOnWebsocket:
                return <div className="vertical_panel">
                    Estabilishing event listener connection...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                    <Button onClick={cancelJob} variant="contained">Cancel</Button>
                </div>;
            case BansuPopupState.Queued:
                return <div className="vertical_panel">
                    Job has been queued.
                    Waiting...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                    <small>Position in queue: {posInQueue}</small>
                    <Button onClick={cancelJob} variant="contained">Cancel</Button>
                </div>;
            case BansuPopupState.Waiting:
                return <div className="vertical_panel">
                    Waiting for Bansu job to complete...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                    <Button onClick={cancelJob} variant="contained">Cancel</Button>
                </div>;
            case BansuPopupState.Ready:
                return <div className="vertical_panel">
                    Ready
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                    <Accordion>
                        <AccordionSummary>
                            Job output
                        </AccordionSummary>
                        <AccordionDetails
                            style={{maxWidth: '300px', wordBreak: 'break-word'}}
                        >
                        {finishedJobOutput}
                        </AccordionDetails>
                    </Accordion>
                    <div className="horizontal_container_centered children_expanded">
                        <Button 
                            onClick={() => setPopoverOpened(false)}
                            variant="contained"
                        >
                            Close
                        </Button>
                        <Button 
                            onClick={() => window.open(`${bansuEndpoint}/get_cif/${jobId}`)}
                            // style={{flex: 'auto'}}
                            variant="contained"
                        >
                            Download CIF
                        </Button>
                        {props.bansu_callback &&
                            <Button
                                onClick={async () => {
                                    try {
                                        const response = await fetch(`${bansuEndpoint}/get_cif/${jobId}`);
                                        const cifText = await response.text();
                                        const [internalId, idFromProp] = props.smiles_list[selectedMolIndex];
                                        props.bansu_callback?.(internalId, idFromProp, cifText);
                                    } catch (err) {
                                        console.error("Error fetching CIF:", err);
                                    }
                                }}
                                variant="contained"
                            >
                                Send to {props.name_of_host_program ? props.name_of_host_program : "host program"}
                            </Button>
                        }
                    </div>
                </div>;
            case BansuPopupState.Error:
                return <div className="vertical_panel">
                <span style={{color: 'red'}}>Error</span>
                <span style={{color: 'darkred'}}>{errorString}</span>
                <div className="horizontal_container_centered children_expanded">
                    <Button 
                        onClick={() => resetState()}
                        variant="contained"
                    >
                        Retry
                    </Button>
                    <Button 
                        onClick={() => setPopoverOpened(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                </div>
            </div>;
        }
    }, [state, popoverOpened, jobId, errorString, finishedJobOutput, posInQueue, userConsent, acedrgFlagP, acedrgFlagZ, selectedMolIndex, props.smiles_list]);

    useEffect(() => {
        if(spawnCounter === 0) return;
        {
            const abort = new AbortController();
            abortRef.current = abort;

            (async () => {
                const postData = JSON.stringify({
                    'smiles': props.smiles_list[selectedMolIndex][2],
                    'commandline_args': [...(acedrgFlagP ? ['-p'] : []), ...(acedrgFlagZ ? ['-z'] : [])]
                });

                try {
                    console.log("Spawning Bansu job with POST data: ", postData);
                    const res = await fetch(`${bansuEndpoint}/run_acedrg`, {
                        method: 'POST',
                        body: postData,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: abort.signal,
                    });
                    if (abort.signal.aborted) return;
                    const jsonData = await res.json();
                    if (abort.signal.aborted) return;
                    console.log("Got json from /run_acedrg: ", jsonData);
                    if(jsonData.job_id === null) {
                        let emsg = `Server returned null job id / no job id. Error message is: ${jsonData.error_message}`;
                        console.error(emsg);
                        setErrorString(emsg);
                        setState(BansuPopupState.Error);
                        return;
                    }
                    setJobId(jsonData.job_id);
                    setState(BansuPopupState.ConnectingOnWebsocket);
                    console.log("Establishing WebSocket connection.");
                    // Create WebSocket connection.
                    let colonSlashSlashPos = bansuEndpoint.indexOf("://");
                    let bansuEndpoint_noprotocol = bansuEndpoint;
                    let bansuProtocol = bansuEndpoint.substring(0, colonSlashSlashPos);
                    let websocketMode = "ws";
                    if(bansuProtocol == "https") {
                        websocketMode = "wss";
                    }
                    if (colonSlashSlashPos != -1) {
                        bansuEndpoint_noprotocol = bansuEndpoint.substring(colonSlashSlashPos + 3);
                    }
                    const socket = new WebSocket(`${websocketMode}://${bansuEndpoint_noprotocol}/ws/${jsonData.job_id}`);

                    // Connection opened
                    socket.addEventListener("open", (_event) => {
                        console.log("Connection on WebSocket established.");
                    });

                    socket.addEventListener("close", (_event) => {
                        console.log("Connection on WebSocket closed.");
                    });

                    socket.addEventListener("error", (event) => {
                        console.error("Connection on WebSocket errored-out: ", event);
                        abortRef.current = null;
                        setErrorString(`WebSocket error: ${event}`);
                        setState(BansuPopupState.Error);
                    });

                    // Listen for messages
                    socket.addEventListener("message", (event) => {
                        const json = JSON.parse(event.data);
                        console.debug("Got JSON from WS: ", json);
                        if(json.status == "Failed") {
                            abortRef.current = null;
                            setErrorString(`Job failed:\n Failure reason: ${json.failure_reason}\n ${json.error_message ? "Error message: " + json.error_message + "\n ": ""} Output:${JSON.stringify(json.job_output)}`);
                            setState(BansuPopupState.Error);
                        } else if(json.status == "Finished") {
                            abortRef.current = null;
                            setFinishedJobOutput(JSON.stringify(json.job_output));
                            setState(BansuPopupState.Ready);
                        } else if(json.status == "Pending") {
                            setState(BansuPopupState.Waiting);
                        } else if(json.status == "Queued") {
                            setPosInQueue(json.queue_position);
                            setState(BansuPopupState.Queued);
                        }
                    });

                    // Close the WebSocket if the abort signal fires (e.g. user clicks Cancel)
                    abort.signal.addEventListener("abort", () => {
                        console.log("Aborting WebSocket connection (if it is still opened).");
                        socket.close();
                    });

                } catch(exception) {
                    if (abort.signal.aborted) return;
                    abortRef.current = null;
                    console.error(`Problem with HTTP request: ${exception}`);
                    setErrorString(`${exception}`);
                    setState(BansuPopupState.Error);
                }
            })();
        }

        return () => {
            if (abortRef.current) {
                console.log("Aborting ongoing Bansu connection pipeline. HTTP(S)/WebSocket connections shall be terminated.");
                abortRef.current.abort();
                abortRef.current = null;
            }
        };
    }, [spawnCounter]);

    return (
        <StyledEngineProvider injectFirst>
            <Tooltip
                title={"Generate CIF via Bansu (runs Acedrg on a server)."}
                enterDelay={1000}
                enterNextDelay={1000}
                disableInteractive
            >
                <Button
                    onClick={() => {
                        resetState();
                        setPopoverOpened(true);
                    }}
                    variant="contained"
                >
                    Generate CIF
                </Button>
            </Tooltip>
            <Popover 
                open={popoverOpened}
                anchorEl={props.anchorEl}
                anchorOrigin={{ vertical: 'center', horizontal: 'center'}}
                transformOrigin={{ vertical: 'center', horizontal: 'center'}}
            >
                <div className={"vertical_popup lhasa_editor LhasaMuiStyling" + (props.dark_mode ? " lhasa_dark_mode" : "")} style={{maxWidth:  '400px', maxHeight: '500px'}}>
                    <div className="vertical_popup_title">
                        Restraints generation via Bansu
                    </div>
                    <div style={{alignSelf: "normal", overflow: 'auto'}}>
                        {popoverContent()}
                    </div>
                </div>
            </Popover>
        </StyledEngineProvider>
    );
}