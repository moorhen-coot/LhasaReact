export interface DisplayModeValue<T extends number> {
  value: T;
}
export type DisplayMode = DisplayModeValue<0>|DisplayModeValue<1>|DisplayModeValue<2>;

export interface DrawingCommandVector {
  push_back(_0: DrawingCommand): void;
  resize(_0: number, _1: DrawingCommand): void;
  size(): number;
  set(_0: number, _1: DrawingCommand): boolean;
  get(_0: number): any;
  delete(): void;
}

export interface Renderer {
  get_commands(): DrawingCommandVector;
  delete(): void;
}

export interface Path {
  commands: DrawingCommandVector;
  has_fill: boolean;
  fill_color: Color;
  stroke_style: BrushStyle;
  delete(): void;
}

export interface TextPositioningValue<T extends number> {
  value: T;
}
export type TextPositioning = TextPositioningValue<0>|TextPositioningValue<1>|TextPositioningValue<2>;

export interface TextStyle {
  positioning: TextPositioning;
  specifies_color: boolean;
  color: Color;
  weight: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
  size: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
  delete(): void;
}

export interface TextSpan {
  style: TextStyle;
  specifies_style: boolean;
  as_subspans(): TextSpanVector;
  has_subspans(): boolean;
  as_caption(): ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
  delete(): void;
}

export interface TextSpanVector {
  push_back(_0: TextSpan): void;
  resize(_0: number, _1: TextSpan): void;
  size(): number;
  set(_0: number, _1: TextSpan): boolean;
  get(_0: number): any;
  delete(): void;
}

export interface Text {
  style: TextStyle;
  spans: TextSpanVector;
  origin: GraphenePoint;
  delete(): void;
}

export interface DrawingCommand {
  as_path(): Path;
  as_text(): Text;
  is_path(): boolean;
  is_arc(): boolean;
  is_line(): boolean;
  is_text(): boolean;
  as_line(): Line;
  as_arc(): Arc;
  delete(): void;
}

export interface DeleteTool {
  delete(): void;
}

export interface ChargeModifier {
  delete(): void;
}

export interface GeometryModifier {
  delete(): void;
}

export interface FormatTool {
  delete(): void;
}

export interface RemoveHydrogensTool {
  delete(): void;
}

export interface ElementValue<T extends number> {
  value: T;
}
export type Element = ElementValue<0>|ElementValue<1>|ElementValue<2>|ElementValue<3>|ElementValue<4>|ElementValue<5>|ElementValue<6>|ElementValue<7>|ElementValue<8>|ElementValue<9>;

export interface ElementInsertion {
  delete(): void;
}

export interface StructureValue<T extends number> {
  value: T;
}
export type Structure = StructureValue<0>|StructureValue<1>|StructureValue<2>|StructureValue<3>|StructureValue<4>|StructureValue<5>|StructureValue<6>;

export interface StructureInsertion {
  delete(): void;
}

export interface BondModifierModeValue<T extends number> {
  value: T;
}
export type BondModifierMode = BondModifierModeValue<0>|BondModifierModeValue<1>|BondModifierModeValue<2>;

export interface BondModifier {
  delete(): void;
}

export interface TransformModeValue<T extends number> {
  value: T;
}
export type TransformMode = TransformModeValue<0>|TransformModeValue<1>;

export interface TransformTool {
  delete(): void;
}

export interface FlipModeValue<T extends number> {
  value: T;
}
export type FlipMode = FlipModeValue<0>|FlipModeValue<1>;

export interface FlipTool {
  delete(): void;
}

export interface ActiveTool {
  delete(): void;
}

export interface MeasurementDirectionValue<T extends number> {
  value: T;
}
export type MeasurementDirection = MeasurementDirectionValue<0>|MeasurementDirectionValue<1>;

export interface ImplWidgetCoreData {
  render(_0: Renderer): void;
  delete(): void;
}

export interface Canvas extends ImplWidgetCoreData {
  get_display_mode(): DisplayMode;
  set_active_tool(_0: ActiveTool): void;
  undo_edition(): void;
  redo_edition(): void;
  set_display_mode(_0: DisplayMode): void;
  clear_molecules(): void;
  set_allow_invalid_molecules(_0: boolean): void;
  get_allow_invalid_molecules(): boolean;
  measure(_0: MeasurementDirection): SizingInfo;
  get_molecule_count(): number;
  set_scale(_0: number): void;
  get_scale(): number;
  on_hover(_0: number, _1: number, _2: boolean): void;
  on_scroll(_0: number, _1: number, _2: boolean): void;
  on_left_click(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_left_click_released(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_right_click(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_right_click_released(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  get_smiles(): ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
  get_smiles_for_molecule(_0: number): ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
  connect(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: any): void;
  delete(): void;
}

export type TextSize = {
  width: number,
  height: number
};

export type SizingInfo = {
  requested_size: number
};

export type GraphenePoint = {
  x: number,
  y: number
};

export type Color = {
  r: number,
  g: number,
  b: number,
  a: number
};

export type BrushStyle = {
  color: Color,
  line_width: number
};

export type Line = {
  start: GraphenePoint,
  end: GraphenePoint,
  style: BrushStyle
};

export type Arc = {
  origin: GraphenePoint,
  radius: number,
  angle_one: number,
  angle_two: number,
  has_fill: boolean,
  fill_color: Color,
  has_stroke: boolean,
  stroke_style: BrushStyle
};

export interface MainModule {
  DisplayMode: {Standard: DisplayModeValue<0>, AtomIndices: DisplayModeValue<1>, AtomNames: DisplayModeValue<2>};
  DrawingCommandVector: {new(): DrawingCommandVector};
  Renderer: {new(_0: any): Renderer};
  Path: {new(): Path};
  TextPositioning: {Normal: TextPositioningValue<0>, Sub: TextPositioningValue<1>, Super: TextPositioningValue<2>};
  TextStyle: {new(): TextStyle};
  TextSpan: {new(): TextSpan};
  TextSpanVector: {new(): TextSpanVector};
  Text: {new(): Text};
  DrawingCommand: {new(): DrawingCommand};
  DeleteTool: {new(): DeleteTool};
  ChargeModifier: {new(): ChargeModifier};
  GeometryModifier: {new(): GeometryModifier};
  FormatTool: {new(): FormatTool};
  RemoveHydrogensTool: {new(): RemoveHydrogensTool};
  Element: {C: ElementValue<0>, N: ElementValue<1>, O: ElementValue<2>, S: ElementValue<3>, P: ElementValue<4>, H: ElementValue<5>, F: ElementValue<6>, Cl: ElementValue<7>, Br: ElementValue<8>, I: ElementValue<9>};
  ElementInsertion: {new(_0: Element): ElementInsertion};
  Structure: {CycloPropaneRing: StructureValue<0>, CycloButaneRing: StructureValue<1>, CycloPentaneRing: StructureValue<2>, CycloHexaneRing: StructureValue<3>, BenzeneRing: StructureValue<4>, CycloHeptaneRing: StructureValue<5>, CycloOctaneRing: StructureValue<6>};
  StructureInsertion: {new(_0: Structure): StructureInsertion};
  BondModifierMode: {Single: BondModifierModeValue<0>, Double: BondModifierModeValue<1>, Triple: BondModifierModeValue<2>};
  BondModifier: {new(_0: BondModifierMode): BondModifier};
  TransformMode: {Rotation: TransformModeValue<0>, Translation: TransformModeValue<1>};
  TransformTool: {new(_0: TransformMode): TransformTool};
  FlipMode: {Horizontal: FlipModeValue<0>, Vertical: FlipModeValue<1>};
  FlipTool: {new(_0: FlipMode): FlipTool};
  ActiveTool: {new(): ActiveTool};
  MeasurementDirection: {HORIZONTAL: MeasurementDirectionValue<0>, VERTICAL: MeasurementDirectionValue<1>};
  ImplWidgetCoreData: {new(): ImplWidgetCoreData};
  Canvas: {new(): Canvas};
  append_from_smiles(_0: Canvas, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): void;
  element_insertion_from_symbol(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): ElementInsertion;
  make_active_tool(_0: any): ActiveTool;
}
