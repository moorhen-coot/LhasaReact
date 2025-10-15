import { useEffect, useId, useRef, useState, createContext, useMemo } from 'react'
import { HotKeys } from "react-hotkeys"
//import * as d3 from "d3";
import { create as D3Create } from 'd3';
import './index.scss';
import './customize_mui.scss';
import { Canvas, Color, DisplayMode, MainModule, QEDInfo, TextMeasurementCache } from './types';
import { ToggleButton, Button, Switch, FormGroup, FormControlLabel, FormControl, RadioGroup, Radio, Slider, TextField, Menu, MenuItem, Accordion, AccordionSummary, AccordionDetails, Popover, StyledEngineProvider, IconButton, Tabs, Tab, Tooltip } from '@mui/material';
import { Redo, Undo } from '@mui/icons-material';
import { QedPropertyInfobox } from './qed_property_infobox';
import { BansuButton } from './bansu_integration';
import { parseInchikeyDatabase } from './inchikey_database_parse';

class ToolButtonProps {
  onclick?: () => void;
  action_name: string | undefined;
  caption: string | undefined;
  caption_optional?: boolean = false;
  icon: string | undefined | null;
  tooltip_body?: React.JSX.Element | null = null;
}

class ActiveToolContextData {
  active_tool_name?: string = '';
  show_optional_captions?: boolean = true;
}

const ActiveToolContext = createContext<ActiveToolContextData>(new ActiveToolContextData());

function ToolButton(props:ToolButtonProps) {
  // console.log(props.caption);
  return (
    <ActiveToolContext.Consumer>
      {context => (
        <Tooltip
          title={props.tooltip_body}
          enterDelay={1000}
          enterNextDelay={1000}
          disableInteractive
        >
          <ToggleButton
            selected={context.active_tool_name == props.action_name}
            onChange={props.onclick}
            value={'dummy'}
            // Doesn't work: autoCapitalize='false'
            style={{textTransform: 'none', padding: '0px'}}
          >
            <div className='tool_button'>
            {props.icon &&
              <>
                <img src={props.icon} className="lhasa_icon" />
              </>}
            {(context.show_optional_captions || !props.caption_optional) && props.caption}
            </div>
          </ToggleButton>
        </Tooltip>
      )}
    </ActiveToolContext.Consumer>
  )
}

// Parameters for scaling the slider
// It's made so that leftmost edge is min_scale
// rightmost edge is max_scale
// and the value of 1 is in the middle

const max_scale = 4;
const min_scale = 0.4;
const c_const = (min_scale*max_scale-1) / (min_scale+max_scale-2);
const d_bottom = (1 - max_scale) / (min_scale - 1);
const d_top= (min_scale-1)**2 / (min_scale+max_scale-2);
const d_const = (Math.log(d_top))/(2 * Math.log(d_bottom));
const theta_const = (max_scale -1)**2 / (min_scale - 1)**2;

class LhasaComponentProps {
  Lhasa: MainModule | any;
  show_top_panel?: boolean;
  show_footer?: boolean;
  icons_path_prefix?: string;
  /// Base64-encoded pickles
  rdkit_molecule_pickle_list?: { pickle: string; id: string }[];
  /// When Lhasa is embedded, what is it embedded in?
  name_of_host_program?: string;
  /// Called when a molecule changes.
  /// Can be provided to get updates when a molecule changes
  smiles_callback?: (internal_id: number, id_from_prop: string | null, smiles: string) => void;
  bansu_endpoint?: string | undefined;
  data_path_prefix?: string;
}


export function LhasaComponent({
  Lhasa, 
  show_top_panel = false, 
  show_footer = true, 
  icons_path_prefix = '', 
  rdkit_molecule_pickle_list,
  name_of_host_program = 'Moorhen',
  smiles_callback,
  bansu_endpoint = 'https://www.ccp4.ac.uk/bansu',
  data_path_prefix = '/',
} : LhasaComponentProps) {
  function on_render(lh: Canvas, text_measurement_cache: TextMeasurementCache, text_measurement_worker_div: string) {
    console.debug("on_render() called.");
  
    const css_color_from_lhasa_color = (lhasa_color: Color) => {
      return 'rgba(' + lhasa_color.r * 255 + ','+ lhasa_color.g * 255 + ',' + lhasa_color.b * 255 + ',' + lhasa_color.a + ')';
    }
    const lhasa_text_to_d3js = (msvg, text) => {
      const style_to_attrstring = (style) => {
        let style_string = "";
        if(style.specifies_color) {
          style_string += "fill:";
          style_string += css_color_from_lhasa_color(style.color);
          style_string += ";";
        }
        // font-size:75%;baseline-shift:sub / super
        switch(style.positioning) {
          case Lhasa.TextPositioning.Normal:
            if(style.size != "") {
              style_string += "font-size:";
              style_string += style.size;
              style_string += ";";
            }
            break;
          case Lhasa.TextPositioning.Sub:
            style_string += "font-size:75%;baseline-shift:sub;";
            break;
          case Lhasa.TextPositioning.Super:
            style_string += "font-size:75%;baseline-shift:super;";
            break;
        }
        if(style.weight != "") {
          style_string += "font-weight:";
          style_string += style.weight;
          style_string += ";";
        }
        return style_string;
      };
      const append_spans_to_node = (spans, text_node, text_origin) => {
        for(let i = 0; i < spans.size(); i++) {
          const span = spans.get(i);
          let child = text_node
            // .enter()
            .append("tspan");
          if(span.specifies_style) {
            child.attr("style", style_to_attrstring(span.style));
          }
          if(span.has_subspans()) {
            append_spans_to_node(span.as_subspans(), child, text_origin);
          } else if(span.is_newline()) {
            child.attr("dy", "1em");
            child.attr("x", text_origin.x);
            // Invisible U+2063 to force tspan to be rendered
            child.text("⁣");
          } else {
            const caption = span.as_caption();
            child.text(caption);
          }
        }
        // return ret;
      }
      const ret = msvg.append("text")
        .attr("x", text.origin.x)
        .attr("y", text.origin.y);
      
      const style_string = style_to_attrstring(text.style);
      if(style_string != "") {
        ret.attr("style", style_string);
      } else {
        // console.warn("Empty style string!");
      }
      if(text.spans.size() == 0) {
        console.warn("Text contains no spans!");
      }
      append_spans_to_node(text.spans, ret, text.origin);
      return ret;
    };
    const text_measure_function = (text) => {
      // let size_info = new Lhasa.TextSize;
      let size_info = {
        'width': 0,
        'height': 0
      };
      try{
        //const domNode = document.createElement("div");
        const domNode = document.getElementById(text_measurement_worker_div);
        if (domNode == null) {
          // todo: do something with this.
          return size_info;
        }
        const msvg = D3Create("svg")
          .attr("width", 100)
          .attr("height", 100)
          .attr("id", "measurement_temporary");
        const text_elem = lhasa_text_to_d3js(msvg, text);
        domNode.append(msvg.node());
        const node = text_elem.node();
        // This has awful performance but I don't really have a choice
        const bbox = node.getBBox();
        size_info.width = Math.ceil(bbox.width);
        size_info.height = Math.ceil(bbox.height);
        // console.log("measurement returning:", size_info);
        msvg.remove();
      } catch(err) {
        console.error('Error occured in text measurement: ', err);
      } finally {
        return size_info;
      }
      
    };
    const ren = new Lhasa.Renderer(text_measure_function, text_measurement_cache);
    lh.render(ren);
    const commands = ren.get_commands();
    const get_width = () => {
      const measured = lh.measure(Lhasa.MeasurementDirection.HORIZONTAL).requested_size;
      const min_size = 480;
      if(measured < min_size) {
        return min_size;
      }
      return measured;
    };
    const get_height = () => {
      const measured = lh.measure(Lhasa.MeasurementDirection.VERTICAL).requested_size;
      const min_size = 270;
      if(measured < min_size) {
        return min_size;
      }
      return measured;
    };
    const svg = D3Create("svg")
      .attr("class", "lhasa_drawing")
      .attr("width", get_width())
      .attr("height", get_height());
  
    for(var i = 0; i < commands.size(); i++) {
      const command = commands.get(i);
      if(command.is_path()) {
        const path = command.as_path();
        // this causes a crash
        // if(path.commands.empty()) {
        //   // console.warn("Empty path!");
        //   // return;
        // }
        // TODO: COMPLETE REWRITE 
        const path_node = svg.append("path");
        let path_started = false;
        let d_string = "";
        // This should be just a reference
        const elements = path.get_elements();
        for(var j = 0; j < elements.size(); j++) {
          const element = elements.get(j);
          if(element.is_arc()) {
            const arc = element.as_arc();
  
            // Thanks to: https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
            function polarToCartesian(centerX, centerY, radius, angleInRadians) {
              //var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
      
              return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
              };
            }
      
            function describeArc(x, y, radius, startAngle, endAngle){
      
                var start = polarToCartesian(x, y, radius, endAngle);
                var end = polarToCartesian(x, y, radius, startAngle);
      
                var largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
                //var largeArcFlag = "1";
      
                // From the SVG reference:
                //
                // If sweep-flag is '1', 
                // then the arc will be drawn in a "positive-angle" direction 
                // (i.e., the ellipse formula x=cx+rx*cos(theta) and y=cy+ry*sin(theta) 
                // is evaluated such that theta starts at an angle corresponding 
                // to the current point and increases positively until the arc reaches (x,y)). 
                // A value of 0 causes the arc to be drawn in a "negative-angle" direction 
                // (i.e., theta starts at an angle value corresponding to the current point and decreases until the arc reaches (x,y)).
                const sweep = 1;
                var p = path_started ? [] : ["M", start.x, start.y];
                var d = p.concat([
                    "A", radius, radius, 0, largeArcFlag, sweep, end.x, end.y,
                    // "L", x,y,
                    // "L", start.x, start.y,
                    // "Z"
                ]).join(" ");
                // console.log("d", d);
      
                return d;       
            }
  
            d_string += describeArc(arc.origin.x, arc.origin.y, arc.radius, arc.angle_one - 0.001, arc.angle_two) + " "; 
        
          } else if(element.is_line()) {
            const line = element.as_line();
  
            function describeLine(x1, y1, x2, y2) {
              var p = path_started ? [] : ["M", x1, y1];
              var d = p.concat(["L", x2, y2]).join(" ");
              return d;
            }
  
            d_string += describeLine(line.start.x, line.start.y, line.end.x, line.end.y) + " ";
          } else {
            console.error("Unknown path element type");
            console.log(element);
          }
  
          path_started = true;
        }
  
        //Breaks wavy bond
        //d_string += "Z";
        
        path_node.attr("d", d_string);
  
        let style_str = '';
  
        if(path.has_fill) {
          style_str += "fill: " + css_color_from_lhasa_color(path.fill_color) + ";";
        } else {
          style_str += "fill: none;";
        }
        if(path.has_stroke) {
          style_str += "stroke:" + css_color_from_lhasa_color(path.stroke_style.color) + ";";
          style_str += "stroke-width:" + path.stroke_style.line_width + ";";
        }
  
        path_node.attr("style", style_str);
  
  
      } else if(command.is_text()) {
        const text = command.as_text();
        lhasa_text_to_d3js(svg, text);
      }
    }
    commands.delete();
    ren.delete();
    
    const node = svg.node();
    return node;
  };
  const text_measurement_worker_div = useId();
  const smiles_input = useId();
  const x_element_symbol_input = useId();

  // Text measurement relies on elements with certain IDs being in the DOM already.
  // This means that text measurement will be incorrect (zeroed) for the first render
  // meaning that if 'first_render' is true, we should re-render immediately
  const isFirstRenderRef = useRef<boolean>(false);
  // Assigns internal molecule IDs to external pickle IDs as given by rdkit_molecule_pickle_map
  const canvasIdsToPropsIdsRef = useRef<Map<number, string>>(new Map<number, string>());
  /// Database of InChIKey -> [Monomer code, Chemical name], fetched asynchronously
  const inchiKeyDatabase = useRef<Map<string, [string, string]> | null>(null);

  const [svgNode, setSvgNode] = useState(null);
  const [smiles, setSmiles] = useState<[number, string][]>([]);
  const [scale, setScale] = useState<number>(1.0);
  const [statusText, setStatusText] = useState<string>('');
  const [xElementInputShown, setXElementInputShown] = useState<boolean>(false);
  const [activeToolName, setActiveToolName] = useState<string>('');
  
  const [smiles_error_string, setSmilesErrorString] = useState<null | string>(null);
  const [x_element_error_string, setXElementErrorString] = useState<null | string>(null);
  const [qedInfo, setQedInfo] = useState<Map<number, QEDInfo>>(new Map<number, QEDInfo>());

  const setupLhasaCanvas = (tmc: TextMeasurementCache) => {
    const lh = new Lhasa.Canvas();
    lh.connect("queue_redraw", () => {
      const node = on_render(lh, tmc, text_measurement_worker_div);
      setSvgNode(node);
    });

    const on_status_updated = function (status_txt: string) {
      setStatusText(status_txt);
    };
    lh.connect("status_updated", on_status_updated);
    lh.connect("smiles_changed", function () {
      const smiles_array: [number, string][] = [];
      const smiles_map = lh.get_smiles();
      const smiles_keys = smiles_map.keys();
      for(let i = 0; i < smiles_keys.size(); i++) {
        const mol_id = smiles_keys.get(i);
        const smiles_tuple = [mol_id, smiles_map.get(mol_id)] as [number, string];
        smiles_array.push(smiles_tuple);
      }
      smiles_keys.delete();
      smiles_map.delete();
      setSmiles(smiles_array);

      const inchikey_map = lh.get_inchi_keys();
      const inchikey_map_keys = inchikey_map.keys();
      for(let i = 0; i < inchikey_map_keys.size(); i++) {
        const mol_id = inchikey_map_keys.get(i);
        const inchi_key = inchikey_map.get(mol_id) as string;

        let inchi_lookup_result = null;
        // if (inchiKeyDatabase.current != null) {
        if (inchiKeyDatabase.current?.has(inchi_key)) {
          inchi_lookup_result = inchiKeyDatabase.current?.get(inchi_key);
        }
        // } else {
        //   console.warn(`InchiKeyDatabase not loaded. ${inchiKeyDatabase}`);
        // }
        console.log(`Inchi lookup: mol_id=${mol_id} key=${inchi_key} ${inchi_lookup_result ?  `monomer_id=${inchi_lookup_result[0]} chem_name=${inchi_lookup_result[1]}` : inchiKeyDatabase.current != null ? ` not found in database` : ` (database not loaded)`}`);
      }
      inchikey_map_keys.delete();
      inchikey_map.delete();
    });
    lh.connect("molecule_deleted", function (mol_id: number) {
      console.log("Molecule with id " + mol_id + " has been deleted.");
      const newQedInfo = qedInfo;
      newQedInfo.delete(mol_id);
      setQedInfo(newQedInfo);
    });
    lh.connect("scale_changed", function (new_scale: number) {
      console.log('new scale: ', new_scale);
      setScale(new_scale);
    });
    lh.connect("qed_info_updated", function (mol_id: number, qed_info_for_mol: QEDInfo) {
      const newQedInfo = qedInfo;
      newQedInfo.set(mol_id, qed_info_for_mol);
      setQedInfo(newQedInfo);
    });

    const default_scale = 1.0;
    lh.set_scale(default_scale);

    //console.log('Adding demo molecule.');
    //Lhasa.append_from_smiles(lh, "O=C(C)Oc1ccccc1C(=O)O");

    return lh;
  };

  const lh = useRef<any>(null);
  // Text measurement cache
  const tmc = useRef<any>(null);

  useEffect(() => {
    if (tmc.current === null || tmc.current?.isDeleted()) {
      console.log("Creating text measurement cache.");
      tmc.current = new Lhasa.TextMeasurementCache();
    }
    if (lh.current === null || lh.current?.isDeleted()) {
      console.log("Setting up LhasaCanvas.");
      lh.current = setupLhasaCanvas(tmc.current);
    }

    const InchiKeyDatabaseLoaderTask = async () => {
      if (inchiKeyDatabase.current !== null) {
        return;
      }
      let retries_remaining = 15;
      while (retries_remaining > 0) {
        try {
          let begin_time = performance.now();
          console.log("Fetching InchiKeyDatabase...");
          const response: Response = await fetch(data_path_prefix + "Components-inchikey.ich");
          if (!response.ok) {
            throw new Error(`InchiKeyDatabase fetch status: ${response.status}`);
          }
          const raw_data = await response.text();
          let end_time = performance.now();
          console.log(`InchiKeyDatabase fetched successfully in ${(end_time - begin_time).toFixed(2)} ms. Size = ${raw_data.length} bytes. Parsing...`);
          begin_time = performance.now();
          const db = parseInchikeyDatabase(raw_data);
          end_time = performance.now();
          inchiKeyDatabase.current = db;
          console.log(`InchiKeyDatabase parsed successfully in ${(end_time - begin_time).toFixed(2)} ms. Entries = ${db.size}.`);
          break;
        } catch (err) {
          console.error(`Could not fetch InchiKeyDatabase: ${err}\n ${retries_remaining > 0 ? `\nRetrying again in two seconds (retries remaining: ${retries_remaining})...` : "\nGiving up."}`);
          retries_remaining -= 1;
          // Sleep for 2 seconds before retrying
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
    };

    InchiKeyDatabaseLoaderTask();

    return () => {
      if (lh.current !== null && !lh.current?.isDeleted()) {
        console.warn("Cleaning up component upon unmounting.");
        lh.current?.delete();
      }
      if (tmc.current !== null && !tmc.current?.isDeleted()) {
        console.warn("Deleting text measurement cache.");
        tmc.current?.delete();
      }
      canvasIdsToPropsIdsRef.current = new Map<number, string>();
    };
  }, []); // Empty dependency array: run only once on mount and cleanup on unmount

  useEffect(() => {
      if(rdkit_molecule_pickle_list !== undefined) {
        rdkit_molecule_pickle_list.forEach(item => {
          if(! Array.from(canvasIdsToPropsIdsRef.current.values()).some(id => id === item.id) ) {
            const internalId = Lhasa.append_from_pickle_base64(lh.current, item.pickle);
            canvasIdsToPropsIdsRef.current.set(internalId, item.id);
          }
        })
      }
  }, [rdkit_molecule_pickle_list]);

  function switch_tool(tool : any) {
    lh.current?.set_active_tool(Lhasa.make_active_tool(tool));
  };

  function on_x_element_button() {
    setXElementInputShown(prev => !prev);
  }

  function on_smiles_import_button() {
      const smiles_input_el = document.getElementById(smiles_input) as HTMLInputElement;
      try {
        Lhasa.append_from_smiles(lh.current, smiles_input_el.value);
        setSmilesErrorString(null);
      } catch(err) {
        console.warn("Could not import molecule from SMILES: ", err);
        setSmilesErrorString("Could not load import molecule from SMILES. Is your SMILES valid?");
      }
  }

  function on_x_element_submit_button() {
    const symbol_input = document.getElementById(x_element_symbol_input) as HTMLInputElement;
    try {
      const el_ins = Lhasa.element_insertion_from_symbol(symbol_input.value);
      switch_tool(el_ins);
      setXElementInputShown(false);
      setXElementErrorString(null);
    }catch(err) {
      console.warn("Could not set custom element: ", err);
      setXElementErrorString("Could not custom element. The symbol must be invalid.");
    }
  }

  function switch_display_mode(value: string) {
    switch(value) {
      default:
      case 'standard':
        lh.current?.set_display_mode(Lhasa.DisplayMode.Standard);
        break;
      case 'atom_indices':
        lh.current?.set_display_mode(Lhasa.DisplayMode.AtomIndices);
        break;
      case 'atom_names':
        lh.current?.set_display_mode(Lhasa.DisplayMode.AtomNames);
        break;
    }
  };

  function display_mode_to_value_name(value: DisplayMode) {
    switch(value) {
      default:
      case Lhasa.DisplayMode.Standard:
        return 'standard';
      case Lhasa.DisplayMode.AtomIndices:
        return 'atom_indices';
      case Lhasa.DisplayMode.AtomNames:
        return 'atom_names';
    }
  }
  
  // From what I understand, this becomes non-null
  // after the first render at which point it
  // should point to the "lhasa_editor" div.
  const editorRef = useRef<HTMLDivElement>(null);
  // From what I understand, this becomes non-null
  // after the first render at which point it
  // should point to the "editor_canvas_container" div.
  const svgRef = useRef<HTMLDivElement>(null);
  // defers the callback to run after render, which is crucial for text measurement
  // to work after the first render (we need to render it again after the first render)
  useEffect(()=>{
    if(svgRef.current && svgNode) {
      svgRef.current.replaceChildren(svgNode);
      if(isFirstRenderRef.current === true) {
        isFirstRenderRef.current = false;
        const newNode = on_render(lh.current, tmc.current, text_measurement_worker_div);
        setSvgNode(newNode);
      }
    }
  }, [svgNode]);

  const carbon_ring_tooltip = useRef<React.JSX.Element>(<div>
    <b>Carbon Ring Tool</b><br/>
    Insert a carbon ring.<br/>
    <br/>
    <b>Left click on a bond</b> - Insert a carbon ring (of the selected kind) adjacent to the bond.<br/>
    <b>Left click on an atom</b> - Attach a carbon ring (of the selected kind) to the atom.<br/>
    <b>Control + Left click on an atom</b> - Attach a carbon ring (of the selected kind) to the atom (spiro mode).<br/>
    <b>Left click on empty canvas</b> - Initialize a new molecule with the selected kind of carbon ring.
  </div>);

  const element_tool_tooltip = useRef<React.JSX.Element>(<div>
    <b>Element Tool</b><br/>
    Add a new atom or replace an existent atom with the chosen element.<br/>
    <br/>
    <b>Left click on a bond</b> - Insert a new atom (of the selected kind) in between the atoms of the bond.<br/>
    <b>Left click on an atom</b> - Replace the atom with the chosen element.<br/>
    <br/>
    <b><i>X</i></b> allows to manually type in a custom symbol.
  </div>);

  const tool_button_data = useMemo(() => {return {
    Move: { 
      caption:"Move",
      raw_handler:() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Translation)),
      icon: icons_path_prefix + "/layla_move_tool.svg",
      hotkey:"m",
      caption_optional: true,
      tooltip_core: <div>
        <b>Move Tool</b><br/>
        Move molecules around the screen.<br/>
        <b>Left click</b> on a molecule (and drag) to move it.<br/>
        <br/>
        Move mode is also triggered by pressing the <b>Alt</b> key.
      </div>
    },
    Rotate: { 
      caption:"Rotate",
      raw_handler:() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Rotation)),
      icon: icons_path_prefix + "/lhasa_rotate_tool.svg",
      hotkey:"r",
      caption_optional: true,
      tooltip_core: <div>
        <b>Rotate Tool</b><br/>
        Rotate molecules.<br/>
        <br/>
        <b>Left click</b> on a molecule (and drag) to rotate it.<br/>
        Press <b>Alt</b> while dragging to snap angles (by 15 degrees).<br/>
        <br/>
        Rotation mode is also triggered by pressing the <b>Shift</b> key.
      </div>
    },
    Flip_around_X: { 
      caption:"Flip around X",
      raw_handler:() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Horizontal)),
      icon: icons_path_prefix + "/lhasa_flip_x_tool.svg",
      hotkey:"alt+f",
      caption_optional: true,
      tooltip_core: <div>
        <b>Flip Horizontal</b><br/>
        Flip molecule in the X axis.<br/>
        <br/>
        <b>Left click</b> on a molecule to flip it.<br/>
        If there's a single molecule on the screen, it will get flipped when the tool is selected.
      </div>
    },
    Flip_around_Y: { 
      caption:"Flip around Y",
      raw_handler:() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Vertical)),
      icon: icons_path_prefix + "/lhasa_flip_y_tool.svg",
      hotkey:"ctrl+alt+f",
      caption_optional: true,
      tooltip_core: <div>
        <b>Flip Vertical</b><br/>
        Flip molecule in the Y axis.<br/>
        <br/>
        <b>Left click</b> on a molecule to flip it.<br/>
        If there's a single molecule on the screen, it will get flipped when the tool is selected.
      </div>
    },
    Delete_hydrogens: { 
      caption:"Delete hydrogens",
      raw_handler:() => switch_tool(new Lhasa.RemoveHydrogensTool()),
      icon: icons_path_prefix + "/layla_delete_hydrogens_tool.svg",
      hotkey:"alt+delete",
      caption_optional: true,
      tooltip_core: <div>
        <b>Remove Hydrogens Tool</b><br/>
        Removes explicit non-polar hydrogens from the selected molecule.<br/>
        <br/>
        <b>Left click</b> on a molecule to remove explicit non-polar hydrogens.<br/>
        If there's a single molecule on the screen, it will get processed automatically when the tool is selected.
      </div>
    },
    Format: { 
      caption:"Format",
      raw_handler:() => switch_tool(new Lhasa.FormatTool()),
      icon: icons_path_prefix + "/layla_format_tool.svg",
      hotkey:"f",
      caption_optional: true,
      tooltip_core: <div>
        <b>Format Tool</b><br/>
        "Formatting" re-computes atom positions of the selected molecule on the screen.<br/>
        <br/>
        <b>Left click</b> on a molecule to format it.<br/>
        If there's a single molecule on the screen, it will get formatted when the tool is selected.
      </div>
    },
    Single_Bond: { 
      caption:"Single Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Single)),
      icon: icons_path_prefix + "/layla_single_bond.svg",
      hotkey:"s",
      caption_optional: true,
      tooltip_core: <div>
        <b>Single Bond Tool</b><br/>
        Add bond (of the selected kind) or replace an existing one.<br/>
        <br/>
        <b>Left click on a bond</b> - Replace it with the selected kind of bond.<br/>
        <b>Left click on an atom</b> - Append a new bond to the atom (along with a new carbon atom).<br/>
        <b>Left click on an atom and drag</b> - Begin creating new bond via dragging. Release mouse at the final atom to complete the now bond.
      </div>
    },
    Double_Bond: { 
      caption:"Double Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Double)),
      icon: icons_path_prefix + "/layla_double_bond.svg",
      hotkey:"d",
      caption_optional: true,
      tooltip_core: <div>
        <b>Double Bond Tool</b><br/>
        Add bond (of the selected kind) or replace an existing one.<br/>
        <br/>
        <b>Left click on a bond</b> - Replace it with the selected kind of bond.<br/>
        <b>Left click on an atom</b> - Append a new bond to the atom (along with a new carbon atom).<br/>
        <b>Left click on an atom and drag</b> - Begin creating new bond via dragging. Release mouse at the final atom to complete the now bond.
      </div>
    },
    Triple_Bond: { 
      caption:"Triple Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Triple)),
      icon: icons_path_prefix + "/layla_triple_bond.svg",
      hotkey:"t",
      caption_optional: true,
      tooltip_core: <div>
        <b>Triple Bond Tool</b><br/>
        Add bond (of the selected kind) or replace an existing one.<br/>
        <br/>
        <b>Left click on a bond</b> - Replace it with the selected kind of bond.<br/>
        <b>Left click on an atom</b> - Append a new bond to the atom (along with a new carbon atom).<br/>
        <b>Left click on an atom and drag</b> - Begin creating new bond via dragging. Release mouse at the final atom to complete the now bond.
      </div>
    },
    Geometry: { 
      caption:"Geometry",
      raw_handler:() => switch_tool(new Lhasa.GeometryModifier()),
      icon: icons_path_prefix + "/layla_geometry_tool.svg",
      hotkey:"g",
      caption_optional: true,
      tooltip_core: <div>
        <b>Bond Geometry Tool</b><br/>
        Alter geometry of a bond.<br/>
        <br/>
        <b>Left click</b> on a bond cycles between <i>"wedged"</i>, <i>"dashed"</i> and unspecified (<i>"wavy"</i>) bond geometry.<br/>
        Bond geometry is only represented for single bonds.
      </div>
    },
    Charge: { 
      caption:"Charge",
      raw_handler:() => switch_tool(new Lhasa.ChargeModifier()),
      icon: icons_path_prefix + "/layla_charge_tool.svg",
      hotkey:"v",
      caption_optional: true,
      tooltip_core: <div>
        <b>Atom Charge Tool</b><br/>
        Alter charge of an atom.<br/>
        <br/>
        <b>Left click on an atom</b> - Add electrons (more negative charge).<br/>
        <b>Right click on an atom</b> - Remove electrons (more positive charge).
      </div>
    },
    Delete: { 
      caption:"Delete",
      raw_handler:() => switch_tool(new Lhasa.DeleteTool()),
      icon: icons_path_prefix + "/lhasa_delete_tool.svg",
      hotkey:"delete",
      caption_optional: true,
      tooltip_core: <div>
        <b>Delete Tool</b><br/>
        Delete atoms, bonds or molecules.<br/>
        <br/>
        <b>Left click on a bond</b> - Removes the bond (or the whole R-chain).<br/>
        <b>Left click on an atom</b> - Removes the atom (or the whole R-chain).<br/>
        <br/>
        <b>Control + Alt + Left click on a bond</b> - Removes just the bond (without any R-chains).<br/>
        <b>Control + Alt + Left click on an atom</b> - Removes just the atom (without any R-chains).<br/>
        <br/>
        <b>Control + Left click on a molecule</b> - Remove the selected molecule
      </div>
    },
    C3: { 
      caption:"3-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloPropaneRing)),
      icon: icons_path_prefix + "/layla_3c.svg",
      hotkey:"3",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C4: { 
      caption:"4-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloButaneRing)),
      icon: icons_path_prefix + "/layla_4c.svg",
      hotkey:"4",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C5: { 
      caption:"5-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloPentaneRing)),
      icon: icons_path_prefix + "/layla_5c.svg",
      hotkey:"5",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C6: { 
      caption:"6-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloHexaneRing)),
      icon: icons_path_prefix + "/layla_6c.svg",
      hotkey:"6",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    Arom6: { 
      caption:"6-Arom",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.BenzeneRing)),
      icon: icons_path_prefix + "/layla_6arom.svg",
      hotkey:["b","alt+6"],
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C7: { 
      caption:"7-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloHeptaneRing)),
      icon: icons_path_prefix + "/layla_7c.svg",
      hotkey:"7",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C8: { 
      caption:"8-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloOctaneRing)),
      icon: icons_path_prefix + "/layla_8c.svg",
      hotkey:"8",
      caption_optional: true,
      tooltip_core: carbon_ring_tooltip.current
    },
    C: { 
      caption:"C",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.C)),
      icon: null,
      hotkey:"c",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    N: { 
      caption:"N",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.N)),
      icon: null,
      hotkey:"n",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    O: { 
      caption:"O",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.O)),
      icon: null,
      hotkey:"o",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    S: { 
      caption:"S",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.S)),
      icon: null,
      hotkey:"alt+s",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    P: { 
      caption:"P",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.P)),
      icon: null,
      hotkey:"p",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    H: { 
      caption:"H",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.H)),
      icon: null,
      hotkey:"h",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    F: { 
      caption:"F",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.F)),
      icon: null,
      hotkey:"alt+i",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    Cl: { 
      caption:"Cl",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.Cl)),
      icon: null,
      hotkey:"alt+c",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    Br: { 
      caption:"Br",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.Br)),
      icon: null,
      hotkey:"alt+b",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    I: { 
      caption:"I",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.I)),
      icon: null,
      hotkey:"i",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    },
    X: { 
      caption:"X",
      raw_handler:() => on_x_element_button(),
      icon: null,
      hotkey:"x",
      caption_optional: false,
      tooltip_core: element_tool_tooltip.current
    }
  }}, [icons_path_prefix]);

  function wrap_handler(action_name: string, raw_handler: () => void) : () => void {
    return () => {
      setActiveToolName(action_name);
      raw_handler();
    };
  }

  const handler_map = useMemo(() => {
    let ret = Object.fromEntries(
      Object.entries(tool_button_data)
        .map(([k,v]) => [k, wrap_handler(k,v["raw_handler"])])
    );
    // Those are not tool buttons. We handle them manually.
    ret['Undo'] = () => lh.current?.undo_edition();
    ret['Redo'] = () => lh.current?.redo_edition();
    return ret;
  }, [tool_button_data]);

  let tool_buttons = useMemo(() => {
    let m_tool_buttons = new Map<string,React.JSX.Element>();
    for(const [k,v] of Object.entries(tool_button_data)) {
      const hotkey_to_infoblock = (hotkey: string | string[]) => {
        let hotkey_arr = typeof hotkey === 'string' ? [hotkey] : hotkey;
        return (<div className='lhasa_tooltip_keybind_infoblock'>
          <b>Hotkeys:</b><br/><br/>
          {hotkey_arr.map((hotkey_text) => <span key={hotkey_text} className='lhasa_tooltip_keybind_info'>
            {hotkey_text}
          </span>)}
        </div>);
      };
      m_tool_buttons.set(k, ToolButton({
        onclick: () => {handler_map[k]()},
        caption: v.caption,
        caption_optional: v.caption_optional,
        tooltip_body: <div className='lhasa_tooltip'>
          {v.tooltip_core}
          {v.hotkey && 
            hotkey_to_infoblock(v.hotkey)
          }
        </div>,
        icon: v.icon,
        action_name: k
      }));
    }
    return m_tool_buttons;
  }, [tool_button_data, handler_map]);
  

  let key_map = useMemo(() => {
    let ret = Object.fromEntries(
      Object.entries(tool_button_data)
        .filter(([k,v]) => 'hotkey' in v)
        .map(([k,v]) => [k, v['hotkey']])
    );
    // Those are not tool buttons. We handle them manually.
    ret['Undo'] = 'ctrl+z';
    ret['Redo'] = ['ctrl+r','ctrl+shift+z'];
    return ret;
  }, [tool_button_data]);

  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const [editOpened, setEditOpen] = useState<boolean>(false);

  const optionButtonRef = useRef<HTMLButtonElement | null>(null)
  const [optionOpened, setOptionOpen] = useState<boolean>(false);

  const displayModeButtonRef = useRef<HTMLLIElement | null>(null);
  const [displayModeOpened, setDisplayModeOpen] = useState<boolean>(false);
  
  const [aimChecked, setAimChecked] = useState<boolean>(() => lh.current?.get_allow_invalid_molecules());
  
  const [showToolButtonLabels, setShowToolButtonLabels] = useState<boolean>(true);

  const [showQedChecked, setShowQedChecked] = useState<boolean>(false);
  const [qedTab, setQedTab] = useState<number>(0);

  const [editedSmiles, setEditedSmiles] = useState<number | null>(null);


  const scale_mapper = (x) => {
    return theta_const ** (x + d_const) + c_const;
  };

  const reverse_scale_mapper = (f) => {
    return Math.log(f - c_const) / Math.log(theta_const) - d_const;
  };

  const getTargetOffset = (touch: React.Touch, event: React.TouchEvent<HTMLDivElement>) => {
    const boundingRect = (event.target as Element).getBoundingClientRect();
    return {
      x: touch.clientX - boundingRect.left,
      y: touch.clientY - boundingRect.top
    };
  }

  return (
    <>
      <ActiveToolContext.Provider value={{active_tool_name: activeToolName, show_optional_captions: showToolButtonLabels}}>
        <HotKeys keyMap={key_map} handlers={handler_map}>
          <StyledEngineProvider injectFirst>
            <div className="lhasa_editor LhasaMuiStyling" ref={editorRef}>
              {show_top_panel &&
                <div className="horizontal_container">
                  <img src={icons_path_prefix + "/icons/hicolor_apps_scalable_coot-layla.svg"} />
                  <div /*id_="lhasa_hello"*/ >
                    <h3>Welcome to Lhasa!</h3>
                    <p>
                      Lhasa is a WebAssemby port of Layla - Coot's Ligand Editor.<br/>
                      Lhasa is experimental software.
                    </p>
                    <p>
                      This is a demo UI for development purposes.
                    </p>
                  </div>
                </div>
              }
              <div className="horizontal_toolbar">
                <Button 
                  ref={editButtonRef}
                  disableElevation
                  onClick={(_evt) => setEditOpen((prev) => !prev)}
                >
                  Edit
                </Button>
                <Menu
                  open={editOpened}
                  anchorEl={editButtonRef.current}
                  onClose={() => setEditOpen(false)}
                  className="LhasaMuiStyling"
                >
                  <MenuItem onClick={() => handler_map["Undo"]()} >
                    <Undo />
                    Undo <div className="keybind_hint">Ctrl+Z</div>
                  </MenuItem>
                  <MenuItem onClick={() => handler_map["Redo"]()} >
                    <Redo />
                    Redo <div className="keybind_hint">Ctrl+Shift+Z</div>
                  </MenuItem>
                </Menu>
                <Button 
                  ref={optionButtonRef}
                  disableElevation
                  onClick={(_evt) => setOptionOpen((prev) => !prev)}

                >
                  Options
                </Button>
                <Menu
                  open={optionOpened}
                  anchorEl={optionButtonRef.current}
                  onClose={() => setOptionOpen(false)}
                  className="LhasaMuiStyling"
                >
                  <MenuItem>
                    <FormGroup>
                      <FormControlLabel 
                        label="Allow Invalid Molecules" 
                        control={<Switch />}
                        checked={aimChecked}
                        onChange={(_e) => {
                          const new_val = !lh.current?.get_allow_invalid_molecules();
                          lh.current?.set_allow_invalid_molecules(new_val);
                          setAimChecked(new_val);
                        }}
                      />
                      <FormControlLabel 
                        label="Show QED" 
                        control={<Switch />}
                        checked={showQedChecked}
                        onChange={(_e) => {
                          setShowQedChecked(!showQedChecked);
                        }}
                      />
                      <FormControlLabel 
                        label="Show Tool Button Labels" 
                        control={<Switch />}
                        checked={showToolButtonLabels}
                        onChange={(_e) => {
                          setShowToolButtonLabels(!showToolButtonLabels);
                        }}
                      />
                    </FormGroup>
                  </MenuItem>
                  <MenuItem
                      ref={displayModeButtonRef}
                      onClick={(_evt) => setDisplayModeOpen((prev) => !prev)}
                  >
                      Display Mode...
                  </MenuItem>
                  <Popover
                  open={displayModeOpened}
                  anchorEl={displayModeButtonRef.current}
                  anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                  onClose={() => setDisplayModeOpen(false)}
                  className="LhasaMuiStyling"
                  //  onMouseOut={(_ev) => setDisplayModeAnchorEl(null)}
                  >
                    <FormControl>
                      <RadioGroup
                        name="display_mode"
                        onChange={(_event, value) => switch_display_mode(value)}
                        value={display_mode_to_value_name(lh.current?.get_display_mode())}
                      >
                        <FormControlLabel 
                          label="Standard"
                          control={<Radio/>}
                          value="standard"
                        />
                        <FormControlLabel 
                          label="Atom Indices"
                          control={<Radio/>}
                          value="atom_indices"
                        />
                        <FormControlLabel 
                          label="Atom Names"
                          control={<Radio/>}
                          value="atom_names"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Popover>
                </Menu>
              </div>
              <div /*id_="molecule_tools_toolbar"*/ className="horizontal_toolbar">
                { tool_buttons.get("Move") }
                { tool_buttons.get("Rotate") }
                { tool_buttons.get("Flip_around_X") }
                { tool_buttons.get("Flip_around_Y") }
                { tool_buttons.get("Delete_hydrogens") }
                { tool_buttons.get("Format") }
              </div>
              <div /*id_="main_tools_toolbar"*/ className="horizontal_toolbar">
                { tool_buttons.get("Single_Bond") }
                { tool_buttons.get("Double_Bond") }
                { tool_buttons.get("Triple_Bond") }
                { tool_buttons.get("Geometry") }
                { tool_buttons.get("Charge") }
                { tool_buttons.get("Delete") }
              </div>
              <div /*id_="structure_toolbar"*/ className="horizontal_toolbar">
                { tool_buttons.get("C3") }
                { tool_buttons.get("C4") }
                { tool_buttons.get("C5") }
                { tool_buttons.get("C6") }
                { tool_buttons.get("Arom6") }
                { tool_buttons.get("C7") }
                { tool_buttons.get("C8") }
                <div className="scale_panel vertical_panel">
                  <div className='horizontal_container'>
                    <b>SCALE</b>
                    <div className="scale_display">
                      {scale.toFixed(2)}
                    </div>
                  </div>
                  <div className="horizontal_panel" style={{border: "0px", padding: "0px"}}>
                    <IconButton
                      onClick={() => {const s = lh.current?.get_scale(); lh.current?.set_scale(s-0.05);}}
                    >
                      <b>-</b>
                    </IconButton>
                    <Slider 
                      value={reverse_scale_mapper(lh.current?.get_scale() ?? 1.0)}
                      max={1}
                      min={0}
                      step={0.0001}
                      // marks={[0.5,1,2]}
                      scale={scale_mapper}
                      // valueLabelDisplay="auto"
                      // valueLabelFormat={(v) => v.toFixed(2)}
                      onChange={(_ev, scale)=>{ lh.current?.set_scale(scale_mapper(scale))}}
                    />
                    <IconButton
                      onClick={() => {const s = lh.current?.get_scale(); lh.current?.set_scale(s+0.05);}}
                    >
                      <b>+</b>
                    </IconButton>
                  </div>
                </div>
              </div>
              {xElementInputShown && 
                <>
                  <div className="x_element_panel horizontal_panel" >
                    <TextField
                      label="Custom element symbol"
                      id={x_element_symbol_input}
                      variant="outlined"
                      error={x_element_error_string != null}
                      helperText={x_element_error_string}
                      style={{alignSelf: "center", flexGrow: "1"}}
                    />
                    <Button
                    variant='contained'
                    // className='x_element_submit_button'
                    onClick={() => on_x_element_submit_button()}
                    >
                      Submit
                    </Button>
                  </div>
                </>
              }
              <div /*id_="main_horizontal_container"*/ className="horizontal_panel">
                <div /*id_="element_toolbar"*/ className="vertical_toolbar">
                { tool_buttons.get("C") }
                { tool_buttons.get("N") }
                { tool_buttons.get("O") }
                { tool_buttons.get("S") }
                { tool_buttons.get("P") }
                { tool_buttons.get("H") }
                { tool_buttons.get("F") }
                { tool_buttons.get("Cl") }
                { tool_buttons.get("Br") }
                { tool_buttons.get("I") }
                { tool_buttons.get("X") }
                </div>
                <div 
                  className="editor_canvas_container"
                  onContextMenu={(e) => {e.preventDefault();}}
                  onMouseMove={(event) => {
                    // console.log('Mousemove');
                    lh.current?.on_hover(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey);
                  }}
                  onMouseDown={(event) => {
                    if(event.button == 0) {
                      //console.log('lclick');
                      lh.current?.on_left_click(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                    } else if(event.button == 2) {
                      //console.log('rclick');
                      lh.current?.on_right_click(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                    }
                  }}
                  onMouseUp={(event) => {
                    if(event.button == 0) {
                      //console.log('lreleased');
                      lh.current?.on_left_click_released(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                    } else if(event.button == 2) {
                      //console.log('rreleased');
                      lh.current?.on_right_click_released(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                    }
                  }}
                  onWheel={(event) => {
                    lh.current?.on_scroll(event.deltaX, event.deltaY, event.altKey);
                  }}
                  onTouchStart={(event) => {
                    // console.log('touchstart');
                    if (event.touches.length === 1) {
                      const touch = event.touches[0];
                      const offset = getTargetOffset(touch, event);
                      lh.current?.on_left_click(offset.x, offset.y, event.altKey, event.ctrlKey, event.shiftKey);
                    }
                  }}
                  onTouchEnd={(event) => {
                    // console.log('touchend');
                    if (event.touches.length === 1) {
                      const touch = event.touches[0];
                      const offset = getTargetOffset(touch, event);
                      lh.current?.on_left_click_released(offset.x, offset.y, event.altKey, event.ctrlKey, event.shiftKey);
                    }
                  }}
                  onTouchMove={(event) => {
                    // console.log('touchmove');
                    if (event.touches.length === 1) {
                      const touch = event.touches[0];
                      const offset = getTargetOffset(touch, event);
                      lh.current?.on_hover(offset.x, offset.y, event.altKey, event.ctrlKey);
                    }
                  }}

                  ref={svgRef}

                >
                  <div className="pre_render_message">Lhasa not rendered.</div>
                </div>
                <div id={text_measurement_worker_div} className="text_measurement_worker_div">
                  {/* Ugly, I know */}
                </div>
              </div>
              <div className="status_display_panel horizontal_panel">
                <span>▶</span>
                <span /*id_="status_display"*/>{ statusText }</span>
              </div>
              <Accordion>
                <AccordionSummary>
                  <b>SMILES</b>
                </AccordionSummary>
                <AccordionDetails>
                  <div className="smiles_display vertical_panel">
                    {smiles.map((smiles_tuple) => <div key={smiles_tuple[0]} className='horizontal_container'>
                      {smiles_callback && <Button variant="contained" onClick={() => {
                        const lookup_result = canvasIdsToPropsIdsRef.current.get(smiles_tuple[0]);
                        let external_id = null;
                        if(lookup_result !== undefined) {
                          external_id = lookup_result;
                        }
                        smiles_callback(smiles_tuple[0], external_id, smiles_tuple[1])
                      }}>Send to {name_of_host_program}</Button>}
                      {bansu_endpoint &&
                        <BansuButton 
                          smiles={smiles_tuple[1]}
                          anchorEl={editorRef.current}
                          bansu_endpoint={bansu_endpoint}
                        />
                      }
                      <TextField 
                        variant="standard"
                        value={editedSmiles !== smiles_tuple[0] ? smiles_tuple[1] : undefined}
                        onFocus={(_event) => setEditedSmiles(smiles_tuple[0])}
                        onBlur={(_event) => setEditedSmiles(null)}
                        onChange={(event) => lh.current.update_molecule_from_smiles(smiles_tuple[0], event.target.value)}
                      />
                      </div>)}
                  </div>
                  {/* <Divider /> */}
                  <div className="horizontal_toolbar">
                    {/* SMILES:  */}
                    <TextField
                      label="SMILES"
                      id={smiles_input}
                      variant="outlined"
                      error={smiles_error_string != null}
                      helperText={smiles_error_string}
                      style={{"flexGrow": 1}}
                    />
                    <Button 
                      variant="contained" 
                      onClick={() => on_smiles_import_button()} 
                    >
                      Import SMILES
                    </Button>
                  </div>
                </AccordionDetails>
              </Accordion>
              {showQedChecked &&
                <div className="vertical_toolbar qed_panel">
                  <b>QED</b>
                  <Tabs value={qedTab} onChange={(event, value) => setQedTab(value)}>

                  {Array.from(qedInfo.keys()).map((mol_id) => {
                    // Counter-intuitively, a "Tab" here is what Gtk considers to be a tab label
                    return <Tab 
                      key={mol_id}
                      label={mol_id.toString()}
                      value={mol_id}
                    />;
                  })}
                  </Tabs>
                  {Array.from(qedInfo.keys()).map((mol_id) => {
                    // This is the proper tab
                    return <div hidden={qedTab !== mol_id} role="tabpanel" key={mol_id}>
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
                            display_value={qedInfo.get(mol_id)?.alogp.toFixed(4)}
                            progressbar_value={qedInfo.get(mol_id)?.ads_alogp}
                          />
                          <QedPropertyInfobox 
                            property_name='#ALERTS'
                            display_value={qedInfo.get(mol_id)?.number_of_alerts}
                            progressbar_value={qedInfo.get(mol_id)?.ads_alert}
                          />
                          <QedPropertyInfobox 
                            property_name='#HBA'
                            display_value={qedInfo.get(mol_id)?.number_of_hydrogen_bond_acceptors}
                            progressbar_value={qedInfo.get(mol_id)?.ads_hba}
                          />
                        </div>
                        <div className="vertical_panel" style={{flexGrow: 1}}>    
                          <QedPropertyInfobox 
                            property_name='#HBD'
                            display_value={qedInfo.get(mol_id)?.number_of_hydrogen_bond_donors}
                            progressbar_value={qedInfo.get(mol_id)?.ads_hbd}
                          />
                          <QedPropertyInfobox 
                            property_name='#AROM'
                            display_value={qedInfo.get(mol_id)?.number_of_aromatic_rings}
                            progressbar_value={qedInfo.get(mol_id)?.ads_arom}
                          />
                          <QedPropertyInfobox 
                            property_name='#RotBonds'
                            display_value={qedInfo.get(mol_id)?.number_of_rotatable_bonds}
                            progressbar_value={qedInfo.get(mol_id)?.ads_rotb}
                          />
                        </div>
                      </div>
                    </div>;
                  })}
                </div>
              }
              {show_footer &&
                <div className="lhasa_footer">
                  <i>Written by Jakub Smulski</i>
                </div>
              }
            </div>
          </StyledEngineProvider>
        </HotKeys>
      </ActiveToolContext.Provider>
    </>
  )
}
