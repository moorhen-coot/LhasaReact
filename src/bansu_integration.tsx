import { Popover, Button, Tooltip, StyledEngineProvider } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

// Do I really need that here?
import './index.scss';
import './customize_mui.scss';

class BansuPopupProps {
    smiles!: string;
    anchorEl?: HTMLElement | null;
    // internal_id: 
}

// Do I want to use an enum?
// Or do I way to express the state with variables alone?
enum BansuPopupState {
    Connecting,
    SpawningJob,
    Waiting,
    Ready,
    Error
}

export function BansuButton(props: BansuPopupProps) {

    const [popoverOpened, setPopoverOpened] = useState<boolean>(false);

    const [state, setState] = useState<BansuPopupState>(BansuPopupState.Connecting);

    const [workerPromise, setWorkerPromise] = useState<null>(null);

    const popoverContent = useCallback(() => {
        if(!popoverOpened) {
            return <></>;
        }
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
        switch(state) {
            case BansuPopupState.Connecting:
                let promise = new Promise(async () => {
                    await sleep(900);
                    setState(BansuPopupState.SpawningJob);
                });
                return "Connecting";
            case BansuPopupState.SpawningJob:
                let promise2 = new Promise(async () => {
                    await sleep(900);
                    setState(BansuPopupState.Waiting);
                });
                return "SpawningJob";
            case BansuPopupState.Waiting:
                let promise3 = new Promise(async () => {
                    await sleep(900);
                    setState(BansuPopupState.Ready);
                });
                return "Waiting";
            case BansuPopupState.Ready:
                return <div className="vertical_container">
                    Ready
                    <Button onClick={() => setPopoverOpened(false)}>
                        Close
                    </Button>
                </div>;
            case BansuPopupState.Error:
                return "Error";
        }
    }, [state, popoverOpened]);

    useEffect(() => {


        return () => {

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
                        setState(BansuPopupState.Connecting);
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
                {
                    popoverContent()
                }
            </Popover>
        </StyledEngineProvider>
    );
}