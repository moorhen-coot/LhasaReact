import { Popover } from "@mui/material";
import { JSX, useRef, useState } from "react";

class TooltipProps {
    children!: JSX.Element;
    tooltip_body: JSX.Element | undefined | null;
}

export function LhasaTooltip(props: TooltipProps) : JSX.Element {

    const [contentHovered, setContentHovered] = useState<boolean>(false);
    const [popoverHovered, setPopoverHovered] = useState<boolean>(false);
    const mref = useRef<HTMLDivElement | null>(null);

    return (<>
        <div 
            ref={mref} 
            onMouseEnter={() => setContentHovered(true)}
            onMouseOut={() => setContentHovered(false)}
        >
            {props.children}
        </div>
        { props.tooltip_body &&
            <Popover
                anchorEl={mref.current}
                anchorOrigin={{horizontal: 'center', vertical: 'top'}}
                open={contentHovered || popoverHovered}

                onMouseEnter={() => setPopoverHovered(true)}
                onMouseOut={() => setPopoverHovered(false)}
            >
                {props.tooltip_body ? props.tooltip_body : <></>}
            </Popover>
        }
    </>);
}