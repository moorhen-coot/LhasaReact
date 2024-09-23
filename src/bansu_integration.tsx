import { Popover, Button, Tooltip, StyledEngineProvider, AccordionSummary, AccordionDetails, Accordion } from "@mui/material";
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
    SpawningJob,
    ConnectingOnWebsocket,
    Waiting,
    Ready,
    Error
}

export function BansuButton(props: BansuPopupProps) {

    const [popoverOpened, setPopoverOpened] = useState<boolean>(false);
    const [state, setState] = useState<BansuPopupState>(BansuPopupState.SpawningJob);
    const [jobId, setJobId] = useState<string | null>(null);
    const [finishedJobOutput, setFinishedJobOutput] = useState<string | null>(null);
    const [errorString, setErrorString] = useState<string | null>(null);

    const [workerPromise, setWorkerPromise] = useState<null | Promise<void>>(null);

    const resetState = () => {
        setState(BansuPopupState.SpawningJob);
    }

    const popoverContent = useCallback(() => {
        if(!popoverOpened) {
            return <></>;
        }
        switch(state) {
            case BansuPopupState.SpawningJob:
                return <div className="vertical_panel">
                    Spawning Bansu job...
                    <small>Bansu instance <i>{props.bansu_endpoint}</i></small>
                </div>;
            case BansuPopupState.ConnectingOnWebsocket:
                return <div className="vertical_panel">
                    Estabilishing event listener connection...
                    <small>Bansu instance <i>{props.bansu_endpoint}</i></small>
                    <small>Job id: {jobId}</small>
                </div>;
            case BansuPopupState.Waiting:
                return <div className="vertical_panel">
                    Waiting for Bansu job...
                    <small>Bansu instance <i>{props.bansu_endpoint}</i></small>
                    <small>Job id: {jobId}</small>
                </div>;
            case BansuPopupState.Ready:
                return <div className="vertical_panel">
                    Ready
                    <small>Bansu instance <i>{props.bansu_endpoint}</i></small>
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
                    <Button 
                        onClick={(e) => window.open(`http://${props.bansu_endpoint}/get_cif/${jobId}`)}
                        // style={{flex: 'auto'}}
                        variant="contained"
                    >
                        Download CIF
                    </Button>
                    <Button 
                        onClick={() => setPopoverOpened(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                </div>;
            case BansuPopupState.Error:
                return <div className="vertical_panel">
                <span style={{color: 'red'}}>Error</span>
                <span style={{color: 'darkred'}}>{errorString}</span>
                <div className="horizontal_container">
                    <Button 
                        onClick={() => setPopoverOpened(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={() => resetState()}
                        variant="contained"
                    >
                        Retry
                    </Button>
                </div>
            </div>;
        }
    }, [state, popoverOpened, jobId, errorString, finishedJobOutput]);

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
                    const res = await fetch(`http://${props.bansu_endpoint}/run_acedrg`, {
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
                    const socket = new WebSocket(`ws://${props.bansu_endpoint}/ws/${jsonData.job_id}`);

                    // Connection opened
                    socket.addEventListener("open", (event) => {
                        console.log("Connection on WebSocket established.");
                        setState(BansuPopupState.Waiting);
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
                            setErrorString(`Job failed:\n Failure reason: ${json.failure_reason}\n Output:${JSON.stringify(json.job_output)}`);
                            setState(BansuPopupState.Error);
                        } else if(json.status == "Finished") {
                            setFinishedJobOutput(JSON.stringify(json.job_output));
                            setState(BansuPopupState.Ready);
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
            >
                <div className="vertical_popup lhasa_editor LhasaMuiStyling" style={{maxWidth:  '400px', maxHeight: '200px'}}>
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