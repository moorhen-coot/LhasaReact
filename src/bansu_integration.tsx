import { Popover, Button, Tooltip, StyledEngineProvider } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
// import WebSocket from 'ws';
// import * as http from 'http';

// Do I really need that here?
import './index.scss';
import './customize_mui.scss';

class BansuPopupProps {
    smiles!: string;
    anchorEl?: HTMLElement | null;
    bansu_endpoint!: { hostname: string, port: number };
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
    const [errorString, setErrorString] = useState<string | null>(null);

    const [workerPromise, setWorkerPromise] = useState<null | Promise<void>>(null);

    const resetState = () => {
        setState(BansuPopupState.SpawningJob);
    }

    const popoverContent = useCallback(() => {
        if(!popoverOpened) {
            return <></>;
        }
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
        switch(state) {
            case BansuPopupState.SpawningJob:
                let promise1 = new Promise(async () => {
                    await sleep(1900);
                    setState(BansuPopupState.ConnectingOnWebsocket);
                });
                return <div className="vertical_panel">
                    Spawning Bansu job...
                    <small>Bansu instance <i>{props.bansu_endpoint.hostname}:{props.bansu_endpoint.port}</i></small>
                </div>;
            case BansuPopupState.ConnectingOnWebsocket:
                let promise2 = new Promise(async () => {
                    await sleep(1900);
                    setState(BansuPopupState.Waiting);
                });
                return <div className="vertical_panel">
                    Estabilishing event listener connection...
                    <small>Bansu instance <i>{props.bansu_endpoint.hostname}:{props.bansu_endpoint.port}</i></small>
                    <small>Job id: {jobId}</small>
                </div>;
            case BansuPopupState.Waiting:
                let promise3 = new Promise(async () => {
                    await sleep(1900);
                    setState(BansuPopupState.Ready);
                });
                return <div className="vertical_panel">
                    Waiting for Bansu job...
                    <small>Bansu instance <i>{props.bansu_endpoint.hostname}:{props.bansu_endpoint.port}</i></small>
                    <small>Job id: {jobId}</small>
                </div>;
            case BansuPopupState.Ready:
                // let promise4 = new Promise(async () => {
                //     await sleep(1900);
                //     setErrorString("pierd");
                //     setState(BansuPopupState.Error);
                // });
                return <div className="vertical_panel">
                    Ready
                    <Button variant="contained">
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
    }, [state, popoverOpened, jobId]);

    useEffect(() => {
        return;
        if(popoverOpened && state == BansuPopupState.SpawningJob) {
            let promise = new Promise<void>(async () => {
                setState(BansuPopupState.SpawningJob);
                const postData = JSON.stringify({
                    'smiles': props.smiles,
                    'commandline_args': []
                });
    
                try {
                    const res = await fetch(`http://${props.bansu_endpoint.hostname}:${props.bansu_endpoint.port}/run_acedrg`, {
                        method: 'POST',
                        body: postData,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // mode: 'no-cors'
                    });
                    const jsonData = await res.json();
                    console.log("Got json: ", jsonData);
                    if(jsonData.job_id === null) {
                        let emsg = `Server returned null job id. Error message is: ${jsonData.error_message}`;
                        console.error(emsg);
                        setErrorString(emsg);
                        setState(BansuPopupState.Error);
                    }
                    setState(BansuPopupState.ConnectingOnWebsocket);
                    console.log("Establishing WebSocket connection.");
                    // Create WebSocket connection.
                    const socket = new WebSocket(`ws://${props.bansu_endpoint.hostname}:${props.bansu_endpoint.port}/ws/${jsonData.job_id}`);
                    // todo
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
                <div className="vertical_popup lhasa_editor LhasaMuiStyling">
                    <div className="vertical_popup_title">
                        CIF generation via Bansu
                    </div>
                    <div style={{alignSelf: "normal"}}>
                        {popoverContent()}
                    </div>
                </div>
            </Popover>
        </StyledEngineProvider>
    );
}