import { MouseEventHandler, useEffect, useId, useRef, useState, createContext, useMemo, useLayoutEffect } from 'react'
import { HotKeys } from "react-hotkeys"
import * as d3 from "d3";
import './index.scss';
import { Canvas, Color, MainModule } from './lhasa';
import { ToggleButton, Button, Switch, FormGroup, FormControlLabel, FormControl, RadioGroup, Radio, Slider, TextField, Menu, MenuItem, Accordion, AccordionSummary, AccordionDetails, Divider, Popover } from '@mui/material';
import { ArrowRight, Redo, Undo } from '@mui/icons-material';

class ToolButtonProps {
  onclick: MouseEventHandler<HTMLDivElement> | undefined;
  action_name: string | undefined;
  caption: string | undefined;
  icon: string | undefined | null;
}

const ActiveToolContext = createContext<string>('');

function ToolButton(props:ToolButtonProps) {
  // console.log(props.caption);
  return (
    <ActiveToolContext.Consumer>
      {active_tool_name => (
        <ToggleButton
          variant="outlined"
          selected={active_tool_name == props.action_name}
          // @ts-ignore
          onChange={props.onclick}
          // Doesn't work: autoCapitalize='false'
          style={{textTransform: 'none', padding: '0px'}}
        >
          <div className='tool_button'>
          {props.icon &&
            <>
              <img src={props.icon} className="lhasa_icon" />
              <br />
            </>}
          {props.caption}
          </div>
        </ToggleButton>
      )}
    </ActiveToolContext.Consumer>
  )
}

const max_scale = 18;
const min_scale = 0.1;
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
  rdkit_molecule_pickle_map?: Map<string, string>;
}


export function LhasaComponent({Lhasa, show_top_panel = false, show_footer = true, icons_path_prefix = '', rdkit_molecule_pickle_map} : LhasaComponentProps) {
  function on_render(lh: Canvas, text_measurement_worker_div: string) {
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
      const append_spans_to_node = (spans, text_node) => {
        for(let i = 0; i < spans.size(); i++) {
          const span = spans.get(i);
          let child = text_node
            // .enter()
            .append("tspan");
          if(span.specifies_style) {
            child.attr("style", style_to_attrstring(span.style));
          }
          if(span.has_subspans()) {
            append_spans_to_node(span.as_subspans(), child);
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
      append_spans_to_node(text.spans, ret);
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
        const msvg = d3.create("svg")
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
    const ren = new Lhasa.Renderer(text_measure_function);
    lh.render(ren);
    const commands = ren.get_commands();
    const get_width = () => {
      const measured = lh.measure(Lhasa.MeasurementDirection.HORIZONTAL).requested_size;
      const min_size = 300;
      if(measured < min_size) {
        return min_size;
      }
      return measured;
    };
    const get_height = () => {
      const measured = lh.measure(Lhasa.MeasurementDirection.VERTICAL).requested_size;
      const min_size = 320;
      if(measured < min_size) {
        return min_size;
      }
      return measured;
    };
    const svg = d3.create("svg")
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
        
          } if(element.is_line()) {
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
  const [st, setSt] = useState(() => {
    return {
      // Text measurement relies on elements with certain IDs being in the DOM already.
      // This means that text measurement will be incorrect (zeroed) for the first render
      // meaning that if 'first_render' is true, we should re-render immediately
      first_render: true,
      svg_node: null,
      smiles: [],
      scale: 1.0,
      status_text: '',
      x_element_input_shown: false,
      active_tool_name: '',
      appended_pickles: new Set<string>()
    };
  });
  const [smiles_error_string, setSmilesErrorString] = useState<null | string>(null);
  const [x_element_error_string, setXElementErrorString] = useState<null | string>(null);
  const [lh, setLh] = useState(() => {
    const lh = new Lhasa.Canvas();
    lh.connect("queue_redraw", () => {
      const node = on_render(lh, text_measurement_worker_div);
      setSt(pst =>{
          return {
          ...pst,
          svg_node: node
        };
      });
    });

    const on_status_updated = function (status_txt: string) {
      // For now
      console.log("Status: " + status_txt);
      // todo: fix
      setSt(pst =>{
          return {
          ...pst,
          status_text: status_txt
        };
      });
    };
    lh.connect("status_updated", on_status_updated);
    lh.connect("smiles_changed", function () {
      const smiles_raw = lh.get_smiles();

      const smiles_array = smiles_raw.split("\n");
      console.log(smiles_array);
      // todo: fix
      setSt(pst =>{
          return {
          ...pst,
          smiles: smiles_array
        };
      });
    });
    lh.connect("molecule_deleted", function (mol_id) {
      console.log("Molecule with id " + mol_id + " has been deleted.");
    });
    lh.connect("scale_changed", function (new_scale) {
      console.log('new scale: ', new_scale);
      setSt(pst =>{
          return {
          ...pst,
          scale: new_scale
        };
      });
    });

    const default_scale = 1.0;
    lh.set_scale(default_scale);

    //console.log('Adding demo molecule.');
    //Lhasa.append_from_smiles(lh, "O=C(C)Oc1ccccc1C(=O)O");

    return lh;
  });

  useEffect(() => {
      if(rdkit_molecule_pickle_map !== undefined) {
        for(let entry of rdkit_molecule_pickle_map.entries()) {
          if(! st.appended_pickles.has(entry[0])) {
            Lhasa.append_from_pickle_base64(lh, entry[1]);
            const new_appended_pickles = st.appended_pickles;
            new_appended_pickles.add(entry[0]);
            setSt(pst =>{
                return {
                ...pst,
                appended_pickles: new_appended_pickles
              };
            });
          }
        }
      }
  }, [rdkit_molecule_pickle_map]);

  // This unfortunately does not work
  // useLayoutEffect(() => {
  //   // This tries to prevent the memory leak
  //   // upon component unmounting
  //   return () => {
  //     lh.delete();
  //   };
  // }, []);


  const chLh = (func: () => void) => {
    func();
    // This probably does nothing
    setLh(lh);
  };

  function switch_tool(tool : any) {
    chLh(() => lh.set_active_tool(Lhasa.make_active_tool(tool)));
  };

  function on_x_element_button() {
    setSt(pst =>{
      return {
        ...pst,
        x_element_input_shown: !pst.x_element_input_shown
      }
    });
  }

  function on_smiles_import_button() {
      const smiles_input_el = document.getElementById(smiles_input) as HTMLInputElement;
      chLh(() => {
        try {
          Lhasa.append_from_smiles(lh, smiles_input_el.value);
          setSmilesErrorString(null);
        } catch(err) {
          console.warn("Could not import molecule from SMILES: ", err);
          setSmilesErrorString("Could not load import molecule from SMILES. Is your SMILES valid?");
        }
      });
  }

  function on_x_element_submit_button() {
    const symbol_input = document.getElementById(x_element_symbol_input) as HTMLInputElement;
    try {
      const el_ins = Lhasa.element_insertion_from_symbol(symbol_input.value);
      switch_tool(el_ins);
      setSt(pst =>{
        return {
          ...pst,
          x_element_input_shown: false
        }
      });
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
        chLh(() => lh.set_display_mode(Lhasa.DisplayMode.Standard));
        break;
      case 'atom_indices':
        chLh(() => lh.set_display_mode(Lhasa.DisplayMode.AtomIndices));
        break;
      case 'atom_names':
        chLh(() => lh.set_display_mode(Lhasa.DisplayMode.AtomNames));
        break;
    }
  };

  function display_mode_to_value_name(value: Lhasa.DisplayMode) {
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
  
  const svgRef = useRef<Element>(null);
  // defers the callback to run after render, which is crucial for text measurement
  // to work after the first render (we need to render it again after the first render)
  useEffect(()=>{
    if(svgRef.current && st.svg_node) {
      svgRef.current.replaceChildren(st.svg_node);
      if(st.first_render === true) {
        setSt(pst => {
          return {
            ...pst,
            svg_node: on_render(lh, text_measurement_worker_div),
            first_render: false
          }
        });
      }
    }
  },[st]);

  // @ts-ignore
  const tool_button_data = useRef({
    Move: { 
      caption:"Move",
      raw_handler:() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Translation)),
      icon: icons_path_prefix + "/layla_move_tool.svg",
      hotkey:"m"
    },
    Rotate: { 
      caption:"Rotate",
      raw_handler:() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Rotation)),
      icon: icons_path_prefix + "/lhasa_rotate_tool.svg",
      hotkey:"r"
    },
    Flip_around_X: { 
      caption:"Flip around X",
      raw_handler:() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Horizontal)),
      icon: icons_path_prefix + "/lhasa_flip_x_tool.svg",
      hotkey:"alt+f"
    },
    Flip_around_Y: { 
      caption:"Flip around Y",
      raw_handler:() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Vertical)),
      icon: icons_path_prefix + "/lhasa_flip_y_tool.svg",
      hotkey:"ctrl+alt+f"
    },
    Delete_hydrogens: { 
      caption:"Delete hydrogens",
      raw_handler:() => switch_tool(new Lhasa.RemoveHydrogensTool()),
      icon: icons_path_prefix + "/layla_delete_hydrogens_tool.svg",
      hotkey:"alt+delete"
    },
    Format: { 
      caption:"Format",
      raw_handler:() => switch_tool(new Lhasa.FormatTool()),
      icon: icons_path_prefix + "/layla_format_tool.svg",
      hotkey:"f"
    },
    Single_Bond: { 
      caption:"Single Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Single)),
      icon: icons_path_prefix + "/layla_single_bond.svg",
      hotkey:"s"
    },
    Double_Bond: { 
      caption:"Double Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Double)),
      icon: icons_path_prefix + "/layla_double_bond.svg",
      hotkey:"d"
    },
    Triple_Bond: { 
      caption:"Triple Bond",
      raw_handler:() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Triple)),
      icon: icons_path_prefix + "/layla_triple_bond.svg",
      hotkey:"t"
    },
    Geometry: { 
      caption:"Geometry",
      raw_handler:() => switch_tool(new Lhasa.GeometryModifier()),
      icon: icons_path_prefix + "/layla_geometry_tool.svg",
      hotkey:"g"
    },
    Charge: { 
      caption:"Charge",
      raw_handler:() => switch_tool(new Lhasa.ChargeModifier()),
      icon: icons_path_prefix + "/layla_charge_tool.svg",
      hotkey:"v"
    },
    Delete: { 
      caption:"Delete",
      raw_handler:() => switch_tool(new Lhasa.DeleteTool()),
      icon: icons_path_prefix + "/lhasa_delete_tool.svg",
      hotkey:"delete"
    },
    C3: { 
      caption:"3-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloPropaneRing)),
      icon: icons_path_prefix + "/layla_3c.svg",
      hotkey:"3"
    },
    C4: { 
      caption:"4-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloButaneRing)),
      icon: icons_path_prefix + "/layla_4c.svg",
      hotkey:"4"
    },
    C5: { 
      caption:"5-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloPentaneRing)),
      icon: icons_path_prefix + "/layla_5c.svg",
      hotkey:"5"
    },
    C6: { 
      caption:"6-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloHexaneRing)),
      icon: icons_path_prefix + "/layla_6c.svg",
      hotkey:"6"
    },
    Arom6: { 
      caption:"6-Arom",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.BenzeneRing)),
      icon: icons_path_prefix + "/layla_6arom.svg",
      hotkey:["b","alt+6"]
    },
    C7: { 
      caption:"7-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloHeptaneRing)),
      icon: icons_path_prefix + "/layla_7c.svg",
      hotkey:"7"
    },
    C8: { 
      caption:"8-C",
      raw_handler:() => switch_tool(new Lhasa.StructureInsertion(Lhasa.LhasaStructure.CycloOctaneRing)),
      icon: icons_path_prefix + "/layla_8c.svg",
      hotkey:"8"
    },
    C: { 
      caption:"C",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.C)),
      // icon:"",
      hotkey:"c"
    },
    N: { 
      caption:"N",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.N)),
      // icon:"",
      hotkey:"n"
    },
    O: { 
      caption:"O",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.O)),
      // icon:"",
      hotkey:"o"
    },
    S: { 
      caption:"S",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.S)),
      // icon:"",
      hotkey:"alt+s"
    },
    P: { 
      caption:"P",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.P)),
      // icon:"",
      hotkey:"p"
    },
    H: { 
      caption:"H",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.H)),
      // icon:"",
      hotkey:"h"
    },
    F: { 
      caption:"F",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.F)),
      // icon:"",
      hotkey:"alt+i"
    },
    Cl: { 
      caption:"Cl",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.Cl)),
      // icon:"",
      hotkey:"alt+c"
    },
    Br: { 
      caption:"Br",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.Br)),
      // icon:"",
      hotkey:"alt+b"
    },
    I: { 
      caption:"I",
      raw_handler:() => switch_tool(new Lhasa.ElementInsertion(Lhasa.LhasaElement.I)),
      // icon:"",
      hotkey:"i"
    },
    X: { 
      caption:"X",
      raw_handler:() => on_x_element_button(),
      // icon:"",
      hotkey:"x"
    }
  });

  function wrap_handler(action_name: string, raw_handler: () => void) : () => void {
    return () => {
      setSt(pst => {
        return {
          ...pst,
          active_tool_name: action_name
        }
      });
      raw_handler();
    };
  }

  const handler_map = useMemo(() => {
    let ret = Object.fromEntries(
      Object.entries(tool_button_data.current)
        .map(([k,v]) => [k, wrap_handler(k,v["raw_handler"])])
    );
    // Those are not tool buttons. We handle them manually.
    ret['Undo'] = () => chLh(() => lh.undo_edition());
    ret['Redo'] = () => chLh(() => lh.redo_edition());
    return ret;
  }, [tool_button_data.current]);

  let tool_buttons = useMemo(() => {
    let m_tool_buttons = new Map<string,JSX.Element>();
    for(const [k,v] of Object.entries(tool_button_data.current)) {
      m_tool_buttons.set(k, ToolButton({
        onclick: () => {handler_map[k]()},
        caption: v.caption,
        // @ts-ignore
        icon: v.icon ?? null,
        action_name: k
      }));
    }
    return m_tool_buttons;
  }, [tool_button_data.current, handler_map]);
  

  let key_map = useMemo(() => {
    let ret = Object.fromEntries(
      Object.entries(tool_button_data.current)
        .filter(([k,v]) => 'hotkey' in v)
        .map(([k,v]) => [k, v['hotkey']])
    );
    // Those are not tool buttons. We handle them manually.
    ret['Undo'] = 'ctrl+z';
    ret['Redo'] = ['ctrl+r','ctrl+shift+z'];
    return ret;
  }, [tool_button_data.current]);

  const [editAnchorEl, setEditAnchorEl] = useState<null | HTMLElement>(null);
  const editOpened = Boolean(editAnchorEl);
  const [optionAnchorEl, setOptionAnchorEl] = useState<null | HTMLElement>(null);
  const optionOpened = Boolean(optionAnchorEl);
  const [displayModeAnchorEl, setDisplayModeAnchorEl] = useState<null | HTMLElement>(null);
  const displayModeOpened = Boolean(displayModeAnchorEl);
  const [aimChecked, setAimChecked] = useState<boolean>(() => lh.get_allow_invalid_molecules());


  const scale_mapper = (x) => {
    return theta_const ** (x + d_const) + c_const;
  };

  const reverse_scale_mapper = (f) => {
    return Math.log(f - c_const) / Math.log(theta_const) - d_const;
  };

  return (
    <>
      <ActiveToolContext.Provider value={st.active_tool_name}>
        <HotKeys keyMap={key_map} handlers={handler_map}>
          <div className="lhasa_editor">
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
                // variant="contained"
                disableElevation
                onClick={(ev) => setEditAnchorEl(ev.currentTarget)}

              >
                Edit
              </Button>
              <Menu
                open={editOpened}
                anchorEl={editAnchorEl}
                onClose={() => setEditAnchorEl(null)}
              >
                <MenuItem onClick={() => handler_map["Undo"]()} >
                  <Undo />
                  Undo
                </MenuItem>
                <MenuItem onClick={() => handler_map["Redo"]()} >
                  <Redo />
                  Redo
                </MenuItem>
              </Menu>
              <Button 
                // variant="contained"
                disableElevation
                onClick={(ev) => setOptionAnchorEl(ev.currentTarget)}

              >
                Options
              </Button>
              <Menu
                open={optionOpened}
                anchorEl={optionAnchorEl}
                onClose={() => setOptionAnchorEl(null)}
              >
                <MenuItem>
                  <FormGroup>
                    <FormControlLabel 
                      label="Allow Invalid Molecules" 
                      control={<Switch />}
                      checked={aimChecked}
                      // @ts-ignore
                      onChange={(_e) => {
                        const new_val = !lh.get_allow_invalid_molecules();
                        chLh(() => lh.set_allow_invalid_molecules(new_val));
                        setAimChecked(new_val);
                      }}
                    />
                  </FormGroup>
                </MenuItem>
                <MenuItem
                    // onMouseOver={(ev) => {if(!displayModeOpened) { setDisplayModeAnchorEl(ev.currentTarget)}}}
                    onClick={(ev) => {if(!displayModeOpened) { setDisplayModeAnchorEl(ev.currentTarget)}}}
                >
                    Display Mode...
                    {/* <ArrowRight/> */}
                </MenuItem>
                <Popover
                 open={displayModeOpened}
                 anchorEl={displayModeAnchorEl}
                 anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                 onClose={() => setDisplayModeAnchorEl(null)}
                //  onMouseOut={(_ev) => setDisplayModeAnchorEl(null)}
                >
                  <FormControl>
                    <RadioGroup
                      name="display_mode"
                      onChange={(_event, value) => switch_display_mode(value)}
                      value={display_mode_to_value_name(lh.get_display_mode())}
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
            </div>
            {st.x_element_input_shown && 
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
                  lh.on_hover(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey);
                }}
                onMouseDown={(event) => {
                  if(event.button == 0) {
                    //console.log('lclick');
                    lh.on_left_click(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                  } else if(event.button == 2) {
                    //console.log('rclick');
                    lh.on_right_click(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                  }
                }}
                onMouseUp={(event) => {
                  if(event.button == 0) {
                    //console.log('lreleased');
                    lh.on_left_click_released(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                  } else if(event.button == 2) {
                    //console.log('rreleased');
                    lh.on_right_click_released(event.nativeEvent.offsetX, event.nativeEvent.offsetY, event.altKey, event.ctrlKey, event.shiftKey);
                  }
                }}
                onWheel={(event) => {
                  lh.on_scroll(event.deltaX, event.deltaY, event.ctrlKey);
                }}

                // @ts-ignore
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
              <span /*id_="status_display"*/>{ st.status_text }</span>
            </div>
            <div className="scale_panel vertical_panel">
              <div className='horizontal_container'>
                <b>SCALE</b>
                <div className="scale_display">
                  {st.scale.toFixed(2)}
                </div>
              </div>
              <Slider 
                value={reverse_scale_mapper(lh.get_scale())}
                max={1}
                min={0}
                step={0.0001}
                // marks={[0.5,1,2]}
                scale={scale_mapper}
                // valueLabelDisplay="auto"
                // valueLabelFormat={(v) => v.toFixed(2)}
                onChange={(_ev, scale)=>{chLh(() => lh.set_scale(scale_mapper(scale)))}}
              />
             
              {/* <div className="horizontal_toolbar">
                <Button
                  variant="outlined" 
                  onClick={() => chLh(() => {const s = lh.get_scale(); lh.set_scale(s-0.05);})}
                >
                  <b>-</b>
                </Button>
                <Button
                  variant="outlined" 
                  onClick={() => chLh(() => {const s = lh.get_scale(); lh.set_scale(s+0.05);})}
                >
                  <b>+</b>
                </Button>
              </div> */}
            </div>
            <Accordion>
              <AccordionSummary>
                <b>SMILES</b>
              </AccordionSummary>
              <AccordionDetails>
                <div className="smiles_display vertical_panel">
                  {st.smiles.map(smiles => <div key={smiles}>{smiles}</div>)}
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
            {show_footer &&
              <div className="lhasa_footer">
                <i>Written by Jakub Smulski</i>
              </div>
            }
          </div>
        </HotKeys>
      </ActiveToolContext.Provider>
    </>
  )
}