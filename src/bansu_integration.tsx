import { Popover, Button, Tooltip, StyledEngineProvider, AccordionSummary, AccordionDetails, Accordion, Input, Switch, Checkbox, FormControlLabel } from "@mui/material";
// import Grid from '@mui/material/Grid2';
import { useCallback, useEffect, useState } from "react";
// import WebSocket from 'ws';
// import * as http from 'http';

// Do I really need that here?
import './index.scss';
import './customize_mui.scss';

class BansuPopupProps {
    smiles!: string;
    anchorEl?: HTMLElement | null;
    bansu_endpoint!: string;
    // internal_id: 
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

    const [workerPromise, setWorkerPromise] = useState<null | Promise<void>>(null);

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
                                checked={userConsent}
                                onChange={() => setUserConsent(!userConsent)}
                            />} 
                        />
                    </div>
                    <b>Bansu job configuration</b>
                    <div className="horizontal_container_centered">
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
                    Commandline flags
                    <div className="horizontal_container_centered">
                        {/* -z
                        <Switch /> */}
                        <i>TODO</i>
                    </div>
                    <div className="horizontal_container_centered children_expanded">
                        <Button 
                            onClick={() => setPopoverOpened(false)}
                            variant="contained"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => setState(BansuPopupState.SpawningJob)}
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
                </div>;
            case BansuPopupState.ConnectingOnWebsocket:
                return <div className="vertical_panel">
                    Estabilishing event listener connection...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                </div>;
            case BansuPopupState.Queued:
                return <div className="vertical_panel">
                    Job has been queued.
                    Waiting...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
                    <small>Position in queue: {posInQueue}</small>
                </div>;
            case BansuPopupState.Waiting:
                return <div className="vertical_panel">
                    Waiting for Bansu job to complete...
                    <small>Bansu instance <i>{bansuEndpoint}</i></small>
                    <small>Job id: {jobId}</small>
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
                            onClick={(e) => window.open(`${bansuEndpoint}/get_cif/${jobId}`)}
                            // style={{flex: 'auto'}}
                            variant="contained"
                        >
                            Download CIF
                        </Button>
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
    }, [state, popoverOpened, jobId, errorString, finishedJobOutput, posInQueue, userConsent]);

    useEffect(() => {
        // return;
        if(popoverOpened && state == BansuPopupState.SpawningJob) {
            let promise = new Promise<void>(async () => {
                setState(BansuPopupState.SpawningJob);
                const postData = JSON.stringify({
                    'smiles': props.smiles,
                    'commandline_args': []
                });
    
                try {
                    const res = await fetch(`${bansuEndpoint}/run_acedrg`, {
                        method: 'POST',
                        body: postData,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // mode: 'no-cors'
                    });
                    const jsonData = await res.json();
                    console.log("Got json from /run_acedrg: ", jsonData);
                    if(jsonData.job_id === null) {
                        let emsg = `Server returned null job id / no job id. Error message is: ${jsonData.error_message}`;
                        console.error(emsg);
                        setErrorString(emsg);
                        setState(BansuPopupState.Error);
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
                    socket.addEventListener("open", (event) => {
                        console.log("Connection on WebSocket established.");
                        // setState(BansuPopupState.Waiting);
                    });

                    socket.addEventListener("close", (event) => {
                        console.log("Connection on WebSocket closed.");
                        // process.exit(0);
                    });

                    socket.addEventListener("error", (event) => {
                        console.error("Connection on WebSocket errored-out: ", event);
                        setErrorString(`WebSocket error: ${event}`);
                        setState(BansuPopupState.Error);
                    });

                    // Listen for messages
                    socket.addEventListener("message", (event) => {
                        //console.debug("Websocket message from server ", event.data);
                        const json = JSON.parse(event.data);
                        console.debug("Got JSON from WS: ", json);
                        if(json.status == "Failed") {
                            setErrorString(`Job failed:\n Failure reason: ${json.failure_reason}\n ${json.error_message ? "Error message: " + json.error_message + "\n ": ""} Output:${JSON.stringify(json.job_output)}`);
                            setState(BansuPopupState.Error);
                        } else if(json.status == "Finished") {
                            setFinishedJobOutput(JSON.stringify(json.job_output));
                            setState(BansuPopupState.Ready);
                        } else if(json.status == "Pending") {
                            setState(BansuPopupState.Waiting);
                        } else if(json.status == "Queued") {
                            setPosInQueue(json.queue_position);
                            setState(BansuPopupState.Queued);
                        }
                    });

                } catch(exception) {
                    console.error(`Problem with HTTP request: ${exception}`);
                    setErrorString(`${exception}`);
                    setState(BansuPopupState.Error);
                }
            });
            setWorkerPromise(promise);
        }

        return () => {
            // todo: cleanup
            // if(workerPromise) {
            //     workerPromise
            // }
        };
    }, [state, popoverOpened]);

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
                <div className="vertical_popup lhasa_editor LhasaMuiStyling" style={{maxWidth:  '400px', maxHeight: '400px'}}>
                    <div className="vertical_popup_title">
                        CIF generation via Bansu
                    </div>
                    <div style={{alignSelf: "normal", overflow: 'auto'}}>
                        {popoverContent()}
                    </div>
                </div>
            </Popover>
        </StyledEngineProvider>
    );
}