import { MouseEventHandler, useEffect, useId, useRef, useState } from 'react'
// import './_App.css'
import './index.css';
import { Lhasa } from './main.tsx'
import * as d3 from "d3";
import { Canvas, Color, DisplayMode } from './lhasa';

class ToolButtonProps {
  onclick: MouseEventHandler<HTMLDivElement> | undefined;
  caption: string | undefined;
  icon: string | undefined | null
}

function ToolButton(props:ToolButtonProps) {
  // console.log(props.caption);
  return (
    <div className="button tool_button" onClick={props.onclick}>
      {props.caption}
      {/* {props.icon && 
        <>
          <img src={props.icon} width="24px" />
          <br/>
        </>} */}
    </div>
  )
}

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
  const svg = d3.create("svg")
    .attr("class", "lhasa_drawing")
    .attr("width", lh.measure(Lhasa.MeasurementDirection.HORIZONTAL).requested_size)
    .attr("height", lh.measure(Lhasa.MeasurementDirection.VERTICAL).requested_size);

  const render_commands = (cmds, node_root = svg) => {
    for(var i = 0; i < cmds.size(); i++) {
      const command = cmds.get(i);
      if(command.is_line()) {
        const line = command.as_line();
        const color = line.style.color;
        node_root.append("line")
          .attr("x1", line.start.x)
          .attr("y1", line.start.y)
          .attr("x2", line.end.x)
          .attr("y2", line.end.y)
          .attr("stroke", css_color_from_lhasa_color(color))
          .attr("stroke-width", line.style.line_width);

      } else if(command.is_arc()) {
        const arc = command.as_arc();
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
            var d = [
                "M", start.x, start.y, 
                "A", radius, radius, 0, largeArcFlag, sweep, end.x, end.y,
                // "L", x,y,
                // "L", start.x, start.y,
                // "Z"
            ].join(" ");
            // console.log("d", d);

            return d;       
        }

        const arc_path = node_root.append("path");
        if(arc.has_stroke) {
          arc_path
            .attr("stroke-width", arc.stroke_style.line_width)
            .attr("stroke", css_color_from_lhasa_color(arc.stroke_style.color));

        }
        if(arc.has_fill) {
          arc_path
            .attr("fill", css_color_from_lhasa_color(arc.fill_color));
        } else {
          arc_path
            .attr("fill", "none");
        }
          
        arc_path
          .attr("d", describeArc(arc.origin.x, arc.origin.y, arc.radius, arc.angle_one - 0.001, arc.angle_two));

      } else if(command.is_path()) {
        const path = command.as_path();
        // this causes a crash
        // if(path.commands.empty()) {
        //   // console.warn("Empty path!");
        //   // return;
        // }
        const new_root = node_root.append("g");
        render_commands(path.commands, new_root);
        if(path.has_fill) {
          console.log("todo: Make sure that fills for paths work.");
          new_root.attr("fill", css_color_from_lhasa_color(path.fill_color));
        }

      } else if(command.is_text()) {
        const text = command.as_text();
        lhasa_text_to_d3js(svg, text);
      }
    }
  };
  render_commands(commands);
  commands.delete();
  ren.delete();
  
  const node = svg.node();
  return node;
};

export function LhasaComponent() {
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
      /// This is only used for user feedback,
      /// i.e. when the user inputs something invalid
      error_message_content: null
    };
  });
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
      console.log('ns', new_scale);
      setSt(pst =>{
          return {
          ...pst,
          scale: new_scale
        };
      });
    });

    console.log('Adding demo molecule.');
    Lhasa.append_from_smiles(lh, "O=C(C)Oc1ccccc1C(=O)O");
    const default_scale = 1.0;
    lh.set_scale(default_scale);
    return lh;
  });
  const chLh = (func: () => void) => {
    func();
    // This probably does nothing
    setLh(lh);
  };

  function switch_tool(tool : any) {
    // todo: pressed buttons
    chLh(() => lh.set_active_tool(Lhasa.make_active_tool(tool)));
  };

  // todo pressed buttons
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
          Lhasa.append_from_smiles(lh, smiles_input_el.value)
        } catch(err) {
          console.warn("Could not import molecule from SMILES: ", err);
          setSt(pst =>{
            return {
              ...pst,
              error_message_content: "Could not load import molecule from SMILES. Is your SMILES valid?"
            }
          });
        }
      });
  }

  function on_x_element_submit_button() {
    const symbol_input = document.getElementById(x_element_symbol_input) as HTMLInputElement;
    // const x_button = document.getElementById("x_element_button");
    try {
      const el_ins = Lhasa.element_insertion_from_symbol(symbol_input.value);
      switch_tool(el_ins);
      setSt(pst =>{
        return {
          ...pst,
          x_element_input_shown: false
        }
      });
    }catch(err) {
      console.warn("Could not set custom element: ", err);
      setSt(pst =>{
        return {
          ...pst,
          error_message_content: "Could not load ElementInsertion tool. Is your symbol valid?"
        }
      });
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
    }
  };
  
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

  useEffect(()=>{
    if(st.error_message_content) {
      // Note that we're not calling 'setSt'.
      // This is on purpose. We don't want React to re-render things now.
      // Otherwise the error message would pop-up and then
      // immediately disappear.
      st.error_message_content = null;
    }
  })

  return (
    <>
      <div className="lhasa_editor">
        <div className="horizontal_container">
          <img src="/icons/icons/hicolor_apps_scalable_coot-layla.svg" />
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
        <div /*id_="molecule_tools_toolbar"*/ className="horizontal_toolbar toolbar horizontal_container">
          <ToolButton caption="Move" onclick={() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Translation))} />
          <ToolButton caption="Rotate" onclick={() => switch_tool(new Lhasa.TransformTool(Lhasa.TransformMode.Rotation))} />
          <ToolButton caption="Flip around X" onclick={() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Horizontal))} />
          <ToolButton caption="Flip around Y" onclick={() => switch_tool(new Lhasa.FlipTool(Lhasa.FlipMode.Vertical))} />
          <ToolButton caption="Delete hydrogens" onclick={() => switch_tool(new Lhasa.RemoveHydrogensTool())} />
          <ToolButton caption="Format" onclick={() => switch_tool(new Lhasa.FormatTool())} />
        </div>
        <div /*id_="main_tools_toolbar"*/ className="horizontal_toolbar toolbar horizontal_container">
          <ToolButton caption="Single Bond" onclick={() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Single))} />
          <ToolButton caption="Double Bond" onclick={() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Double))} />
          <ToolButton caption="Triple Bond" onclick={() => switch_tool(new Lhasa.BondModifier(Lhasa.BondModifierMode.Triple))} />
          <ToolButton caption="Geometry" onclick={() => switch_tool(new Lhasa.GeometryModifier())} />
          <ToolButton caption="Charge" onclick={() => switch_tool(new Lhasa.ChargeModifier())} icon="icons/layla_charge_tool.svg" />
          <ToolButton caption="Delete" onclick={() => switch_tool(new Lhasa.DeleteTool())} />
        </div>
        <div /*id_="structure_toolbar"*/ className="horizontal_toolbar toolbar horizontal_container">
          <ToolButton caption="3-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloPropaneRing))} />
          <ToolButton caption="4-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloButaneRing))} />
          <ToolButton caption="5-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloPentaneRing))} />
          <ToolButton caption="6-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloHexaneRing))} />
          <ToolButton caption="6-Arom" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.BenzeneRing))} />
          <ToolButton caption="7-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloHeptaneRing))} />
          <ToolButton caption="8-C" onclick={() => switch_tool(new Lhasa.StructureInsertion(Lhasa.Structure.CycloOctaneRing))} />
        </div>
        {st.x_element_input_shown && 
          <>
            <div className="x_element_panel panel horizontal_container" >
              <span style={{alignSelf: "center", flexGrow: "1"}}>Custom element symbol: </span>
              <input id={x_element_symbol_input}></input>
            </div>
            <div className="button x_element_submit_button" onClick={() => on_x_element_submit_button()}>Submit</div>
          </>
        }
        {st.error_message_content &&
          <div className="error_display vertical_container vertical_toolbar">
            {st.error_message_content}
          </div>
        }
        <div /*id_="main_horizontal_container"*/ className="horizontal_container">
          <div /*id_="element_toolbar"*/ className="vertical_toolbar toolbar vertical_container">
            <ToolButton caption="C" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.C))} />
            <ToolButton caption="N" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.N))} />
            <ToolButton caption="O" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.O))} />
            <ToolButton caption="S" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.S))} />
            <ToolButton caption="P" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.P))} />
            <ToolButton caption="H" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.H))} />
            <ToolButton caption="F" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.F))} />
            <ToolButton caption="Cl" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.Cl))} />
            <ToolButton caption="Br" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.Br))} />
            <ToolButton caption="I" onclick={() => switch_tool(new Lhasa.ElementInsertion(Lhasa.Element.I))} />
            {/* todo pressed buttons */}
            <ToolButton caption="X" onclick={() => on_x_element_button()} />
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

            // dangerouslySetInnerHTML={st.svg_node != null ? {__html:st.svg_node.outerHTML} : undefined}
            ref={svgRef}

          >
            <div className="pre_render_message">Lhasa not rendered.</div>
          </div>
          <div id={text_measurement_worker_div} className="text_measurement_worker_div">
            {/* Ugly, I know */}
          </div>
        </div>
        <div className="status_display_panel panel">
          <span>▶</span>
          <span /*id_="status_display"*/>{ st.status_text }</span>
        </div>
        <div className="invalid_molecules_panel panel">
          <label>
            <input 
            type="checkbox" 
            /*id_="allow_invalid_molecules_checkbox" */
            name="allow_invalid_molecules"
            onChange={(e) => chLh(() => lh.set_allow_invalid_molecules(e.target.checked))}
            />
            Allow invalid molecules
          </label>
        </div>
        <div /*id_="info_block"*/ className="horizontal_container">
          <div className="scale_panel panel">
            <b>SCALE</b>
            <div className="scale_display">
              {st.scale.toFixed(2)}
            </div>
            <div className="toolbar horizontal_toolbar horizontal_container">
              <div className="button" onClick={() => chLh(() => {const s = lh.get_scale(); lh.set_scale(s-0.05);})}><b>-</b></div>
              <div className="button" onClick={() => chLh(() => {const s = lh.get_scale(); lh.set_scale(s+0.05);})}><b>+</b></div>
            </div>
          </div>
          <div className="display_mode_panel panel">
            <b>DISPLAY MODE</b>
            <br/>
            <label>
              {/* Not sure how to avod redundancy with value in React */}
              <input type="radio" name="display_mode" defaultChecked={true} value="standard" onChange={() => switch_display_mode("standard")} />
              Standard
            </label>
            <br/>
            <label>
              {/* Not sure how to avod redundancy with value in React */}
              <input type="radio" name="display_mode" value="atom_indices" onChange={() => switch_display_mode("atom_indices")} />
              Atom Indices
            </label>
            {/* <!-- <input type="radio" name="display_mode" id_="display_mode_atom_names">Atom Names</input> --> */}
          </div>
          <div className="smiles_display_outer panel">
            <b>SMILES</b>
            <div className="smiles_display">
              {st.smiles.map(smiles => <div key={smiles}>{smiles}</div>)}
            </div>
          </div>
        </div>
        <div /*id_="bottom_toolbar"*/ className="horizontal_toolbar toolbar horizontal_container">
          <div className="button" onClick={() => chLh(() => lh.undo_edition())} >Undo</div>
          <div className="button" onClick={() => chLh(() => lh.redo_edition())} >Redo</div>
          <div style={{"flexGrow": 1}} className="horizontal_container toolbar">
            {/* SMILES:  */}
            <input id={smiles_input} className="smiles_input" />
            <div className="button" onClick={() => on_smiles_import_button()} >Import SMILES</div>
          </div>
        </div>
        <div className="lhasa_footer">
          <i>Written by Jakub Smulski</i>
        </div>
      </div>
    </>
  )
}

export function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
     <LhasaComponent />
    </>
  )
}

// export default App
