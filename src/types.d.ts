// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
    let HEAPF32: any;
    let HEAPF64: any;
    let HEAP_DATA_VIEW: any;
    let HEAP8: any;
    let HEAPU8: any;
    let HEAP16: any;
    let HEAPU16: any;
    let HEAP32: any;
    let HEAPU32: any;
    let HEAP64: any;
    let HEAPU64: any;
}
interface WasmModule {
  __ZN5boost13serialization16singleton_module8get_lockEv(_0: number): number;
  __ZNK5boost7archive6detail11oserializerINS0_13text_oarchiveEN5RDKit9MolBundleEE16save_object_dataERNS1_14basic_oarchiveEPKv(_0: number, _1: number, _2: number): void;
  __ZNK5boost7archive6detail11oserializerINS0_13text_oarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16save_object_dataERNS1_14basic_oarchiveEPKv(_0: number, _1: number, _2: number): void;
  __ZNK5boost7archive6detail11iserializerINS0_13text_iarchiveEN5RDKit9MolBundleEE16load_object_dataERNS1_14basic_iarchiveEPvj(_0: number, _1: number, _2: number, _3: number): void;
  __ZNK5boost7archive6detail11iserializerINS0_13text_iarchiveENSt3__26vectorINS4_12basic_stringIcNS4_11char_traitsIcEENS4_9allocatorIcEEEENS9_ISB_EEEEE16load_object_dataERNS1_14basic_iarchiveEPvj(_0: number, _1: number, _2: number, _3: number): void;
}

type EmbindString = ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  clone(): this;
}
export interface DisplayModeValue<T extends number> {
  value: T;
}
export type DisplayMode = DisplayModeValue<0>|DisplayModeValue<1>|DisplayModeValue<2>;

export interface DrawingCommandVector extends ClassHandle {
  size(): number;
  get(_0: number): DrawingCommand | undefined;
  push_back(_0: DrawingCommand): void;
  resize(_0: number, _1: DrawingCommand): void;
  set(_0: number, _1: DrawingCommand): boolean;
}

export interface PathElementVector extends ClassHandle {
  size(): number;
  get(_0: number): PathElement | undefined;
  push_back(_0: PathElement): void;
  resize(_0: number, _1: PathElement): void;
  set(_0: number, _1: PathElement): boolean;
}

export interface TextMeasurementCache extends ClassHandle {
}

export interface Renderer extends ClassHandle {
  get_commands(): DrawingCommandVector;
}

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

export type GraphenePoint = {
  x: number,
  y: number
};

export type Line = {
  start: GraphenePoint,
  end: GraphenePoint
};

export type Arc = {
  origin: GraphenePoint,
  radius: number,
  angle_one: number,
  angle_two: number
};

export interface PathElement extends ClassHandle {
  is_arc(): boolean;
  as_arc(): Arc;
  as_line(): Line;
  is_line(): boolean;
}

export interface Path extends ClassHandle {
  fill_color: Color;
  has_fill: boolean;
  stroke_style: BrushStyle;
  has_stroke: boolean;
  get_elements(): PathElementVector;
}

export interface TextPositioningValue<T extends number> {
  value: T;
}
export type TextPositioning = TextPositioningValue<0>|TextPositioningValue<1>|TextPositioningValue<2>;

export interface TextStyle extends ClassHandle {
  positioning: TextPositioning;
  get weight(): string;
  set weight(value: EmbindString);
  get size(): string;
  set size(value: EmbindString);
  color: Color;
  specifies_color: boolean;
}

export interface TextSpan extends ClassHandle {
  style: TextStyle;
  specifies_style: boolean;
  has_subspans(): boolean;
  as_caption(): string;
  as_subspans(): TextSpanVector;
}

export interface TextSpanVector extends ClassHandle {
  push_back(_0: TextSpan): void;
  resize(_0: number, _1: TextSpan): void;
  size(): number;
  get(_0: number): TextSpan | undefined;
  set(_0: number, _1: TextSpan): boolean;
}

export type TextSize = {
  width: number,
  height: number
};

export interface Text extends ClassHandle {
  origin: GraphenePoint;
  style: TextStyle;
  spans: TextSpanVector;
}

export interface DrawingCommand extends ClassHandle {
  is_path(): boolean;
  as_path(): Path;
  is_text(): boolean;
  as_text(): Text;
}

export interface DeleteTool extends ClassHandle {
}

export interface ChargeModifier extends ClassHandle {
}

export interface GeometryModifier extends ClassHandle {
}

export interface FormatTool extends ClassHandle {
}

export interface RemoveHydrogensTool extends ClassHandle {
}

export interface LhasaElementValue<T extends number> {
  value: T;
}
export type LhasaElement = LhasaElementValue<0>|LhasaElementValue<1>|LhasaElementValue<2>|LhasaElementValue<3>|LhasaElementValue<4>|LhasaElementValue<5>|LhasaElementValue<6>|LhasaElementValue<7>|LhasaElementValue<8>|LhasaElementValue<9>;

export interface ElementInsertion extends ClassHandle {
}

export interface LhasaStructureValue<T extends number> {
  value: T;
}
export type LhasaStructure = LhasaStructureValue<0>|LhasaStructureValue<1>|LhasaStructureValue<2>|LhasaStructureValue<3>|LhasaStructureValue<4>|LhasaStructureValue<5>|LhasaStructureValue<6>;

export interface StructureInsertion extends ClassHandle {
}

export interface BondModifierModeValue<T extends number> {
  value: T;
}
export type BondModifierMode = BondModifierModeValue<0>|BondModifierModeValue<1>|BondModifierModeValue<2>;

export interface BondModifier extends ClassHandle {
}

export interface TransformModeValue<T extends number> {
  value: T;
}
export type TransformMode = TransformModeValue<0>|TransformModeValue<1>;

export interface TransformTool extends ClassHandle {
}

export interface FlipModeValue<T extends number> {
  value: T;
}
export type FlipMode = FlipModeValue<0>|FlipModeValue<1>;

export interface FlipTool extends ClassHandle {
}

export interface ActiveTool extends ClassHandle {
}

export type SizingInfo = {
  requested_size: number
};

export interface MeasurementDirectionValue<T extends number> {
  value: T;
}
export type MeasurementDirection = MeasurementDirectionValue<0>|MeasurementDirectionValue<1>;

export type QEDInfo = {
  number_of_hydrogen_bond_acceptors: number,
  number_of_hydrogen_bond_donors: number,
  number_of_rotatable_bonds: number,
  number_of_aromatic_rings: number,
  number_of_alerts: number,
  molecular_weight: number,
  alogp: number,
  molecular_polar_surface_area: number,
  ads_mw: number,
  ads_alogp: number,
  ads_hba: number,
  ads_hbd: number,
  ads_psa: number,
  ads_rotb: number,
  ads_arom: number,
  ads_alert: number,
  qed_score: number
};

export interface ImplWidgetCoreData extends ClassHandle {
  render(_0: Renderer): void;
}

export interface SmilesMap extends ClassHandle {
  size(): number;
  get(_0: number): EmbindString | undefined;
  set(_0: number, _1: EmbindString): void;
  keys(): MoleculeIdVector;
}

export interface MoleculeIdVector extends ClassHandle {
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  size(): number;
  get(_0: number): number | undefined;
  set(_0: number, _1: number): boolean;
}

export interface Canvas extends ImplWidgetCoreData {
  set_active_tool(_0: ActiveTool): void;
  update_molecule_from_smiles(_0: number, _1: EmbindString): void;
  set_scale(_0: number): void;
  get_scale(): number;
  undo_edition(): void;
  redo_edition(): void;
  get_molecule_count(): number;
  get_idx_of_first_molecule(): number;
  get_max_molecule_idx(): number;
  set_allow_invalid_molecules(_0: boolean): void;
  get_allow_invalid_molecules(): boolean;
  get_display_mode(): DisplayMode;
  set_display_mode(_0: DisplayMode): void;
  get_smiles(): SmilesMap;
  get_smiles_for_molecule(_0: number): string;
  get_pickled_molecule(_0: number): string;
  get_pickled_molecule_base64(_0: number): string;
  clear_molecules(): void;
  on_hover(_0: number, _1: number, _2: boolean, _3: boolean): void;
  on_scroll(_0: number, _1: number, _2: boolean): void;
  on_left_click(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_left_click_released(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_right_click(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  on_right_click_released(_0: number, _1: number, _2: boolean, _3: boolean, _4: boolean): void;
  measure(_0: MeasurementDirection): SizingInfo;
  connect(_0: EmbindString, _1: any): void;
}

interface EmbindModule {
  DisplayMode: {Standard: DisplayModeValue<0>, AtomIndices: DisplayModeValue<1>, AtomNames: DisplayModeValue<2>};
  DrawingCommandVector: {
    new(): DrawingCommandVector;
  };
  PathElementVector: {
    new(): PathElementVector;
  };
  TextMeasurementCache: {
    new(): TextMeasurementCache;
  };
  Renderer: {
    new(_0: any): Renderer;
    new(_0: any, _1: TextMeasurementCache): Renderer;
  };
  PathElement: {};
  Path: {};
  TextPositioning: {Normal: TextPositioningValue<0>, Sub: TextPositioningValue<1>, Super: TextPositioningValue<2>};
  TextStyle: {
    new(): TextStyle;
  };
  TextSpan: {
    new(): TextSpan;
    new(_0: TextSpanVector): TextSpan;
  };
  TextSpanVector: {
    new(): TextSpanVector;
  };
  Text: {
    new(): Text;
  };
  DrawingCommand: {};
  DeleteTool: {
    new(): DeleteTool;
  };
  ChargeModifier: {
    new(): ChargeModifier;
  };
  GeometryModifier: {
    new(): GeometryModifier;
  };
  FormatTool: {
    new(): FormatTool;
  };
  RemoveHydrogensTool: {
    new(): RemoveHydrogensTool;
  };
  LhasaElement: {C: LhasaElementValue<0>, N: LhasaElementValue<1>, O: LhasaElementValue<2>, S: LhasaElementValue<3>, P: LhasaElementValue<4>, H: LhasaElementValue<5>, F: LhasaElementValue<6>, Cl: LhasaElementValue<7>, Br: LhasaElementValue<8>, I: LhasaElementValue<9>};
  ElementInsertion: {
    new(_0: LhasaElement): ElementInsertion;
  };
  element_insertion_from_symbol(_0: EmbindString): ElementInsertion;
  LhasaStructure: {CycloPropaneRing: LhasaStructureValue<0>, CycloButaneRing: LhasaStructureValue<1>, CycloPentaneRing: LhasaStructureValue<2>, CycloHexaneRing: LhasaStructureValue<3>, BenzeneRing: LhasaStructureValue<4>, CycloHeptaneRing: LhasaStructureValue<5>, CycloOctaneRing: LhasaStructureValue<6>};
  StructureInsertion: {
    new(_0: LhasaStructure): StructureInsertion;
  };
  BondModifierMode: {Single: BondModifierModeValue<0>, Double: BondModifierModeValue<1>, Triple: BondModifierModeValue<2>};
  BondModifier: {
    new(_0: BondModifierMode): BondModifier;
  };
  TransformMode: {Rotation: TransformModeValue<0>, Translation: TransformModeValue<1>};
  TransformTool: {
    new(_0: TransformMode): TransformTool;
  };
  FlipMode: {Horizontal: FlipModeValue<0>, Vertical: FlipModeValue<1>};
  FlipTool: {
    new(_0: FlipMode): FlipTool;
  };
  ActiveTool: {
    new(): ActiveTool;
  };
  make_active_tool(_0: any): ActiveTool;
  MeasurementDirection: {HORIZONTAL: MeasurementDirectionValue<0>, VERTICAL: MeasurementDirectionValue<1>};
  ImplWidgetCoreData: {};
  SmilesMap: {
    new(): SmilesMap;
  };
  MoleculeIdVector: {
    new(): MoleculeIdVector;
  };
  Canvas: {
    new(): Canvas;
  };
  append_from_smiles(_0: Canvas, _1: EmbindString): number;
  append_from_pickle_base64(_0: Canvas, _1: EmbindString): number;
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
