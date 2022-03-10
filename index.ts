const FG_256 = Object.freeze([38, 5]);
const BG_256 = Object.freeze([48, 5]);
const CODE_MAP = {
	RESET:		0,
	BOLD:		1,
	DIM:		2,
	ULINE:		4,
	BLINK:		5,
	INVRT:		7,
	HIDD:		8,

	R_BOLD:		21,
	R_DIM:		22,
	R_ULINE:	24,
	R_BLINK:	25,
	R_INVRT:	27,
	R_HIDD:		28,

	DEF:		29,
	BLAK:		30,
	RED:		31,
	GREN:		32,
	YELL:		33,
	BLUE:		34,
	MEG:		35,
	CYAN:		36,
	GRAY:		37,

	DGRAY:		90,
	LRED:		91,
	LGREN:		92,
	LYELL:		93,
	LBLUE:		94,
	LMEG:		95,
	LCYAN:		96,
	WHITE:		97,

	BG_DEF:		49,
	BG_BLAK:	40,
	BG_RED:		41,
	BG_GREN:	42,
	BG_YELL:	43,
	BG_BLUE:	44,
	BG_MEG:		45,
	BG_CYAN:	46,
	BG_GRAY:	47,

	BG_DGRAY:	100,
	BG_LRED:	101,
	BG_LGREN:	102,
	BG_LYELL:	103,
	BG_LBLUE:	104,
	BG_LMEG:	105,
	BG_LCYAN:	106,
	BG_WHITE:	107,



	reset:				0,
	bold:				1,
	dim:				2,
	underlined:			4,
	blink:				5,
	reverse:			7,
	hidden:				8,

	resetBold:			21,
	resetDim:			22,
	resetUnderlined:	24,
	resetBlink:			25,
	resetReverse:		27,
	resetHidden:		28,

	default:			29,
	black:				30,
	red:				31,
	green:				32,
	yellow:				33,
	blue:				34,
	magenta:			35,
	cyan:				36,
	gray:				37,

	darkGray:			90,
	lightRed:			91,
	lightGreen:			92,
	lightYellow:		93,
	lightBlue:			94,
	lightMagenta:		95,
	lightCyan:			96,
	white:				97,

	bgDefault:			49,
	bgBlack:			40,
	bgRed:				41,
	bgGreen:			42,
	bgYellow:			43,
	bgBlue:				44,
	bgMagenta:			45,
	bgCyan:				46,
	bgGray:				47,

	bgDarkGray:			100,
	bgLightRed:			101,
	bgLightGreen:		102,
	bgLightYellow:		103,
	bgLightBlue:		104,
	bgLightMagenta:		105,
	bgLightCyan:		106,
	bgWhite:			107
};



const ControlCodePrivates = new WeakMap<ControlCode, readonly number[]>();
class ControlCode {
	constructor(...codes:number[]) {
		const _codes = [...codes];
		ControlCodePrivates.set(this, _codes);
	}
	get code():number[] { return ControlCodePrivates.get(this)!.slice(0); }
	toString() { return ANSI(ControlCodePrivates.get(this)!.slice(0)); }
}



interface IColorify {
	(strings:ReadonlyArray<string|ControlCode>, ...args:any[]):string;
	(...strings:readonly any[]):string;

	readonly _ANSI:typeof ANSI;
	readonly _CODE_MAP:typeof CODE_MAP & {FG_256:number[]; BG_256:number[];};

	readonly Color256:(foreground:number, background?:number)=>ControlCode;
	auto_clear:boolean;
}

Object.defineProperties(ANSIVT100Renderer, {
	_ANSI: {value:ANSI},
	_CODE_MAP: {value:Object.freeze({
		...CODE_MAP,
		FG_256,
		BG_256
	})},
	Color256:{value:(foreground:number, background?:number):ControlCode=>{
		const commands:number[] = [];
		
		foreground = foreground | 0;
		if ( foreground < 0 || foreground > 256 ) throw new RangeError("Given foreground color must be ranged from [0, 256];");
		commands.push(...FG_256, foreground);

		if ( background !== undefined ) {
			background = background | 0;
			if ( background < 0 || background > 256 ) throw new RangeError("Given background color must be ranged from [0, 256];");
			commands.push(...BG_256, background);
		}

		return new ControlCode(...commands)
	}},
	auto_clear: {writable:true, value:true}
});
const Colorify = <IColorify&{[k in keyof typeof CODE_MAP]:ControlCode}>ANSIVT100Renderer;
for(const _key in CODE_MAP) {
	const key = _key as (keyof typeof CODE_MAP);
	Object.defineProperty(Colorify, key, {value:new ControlCode(CODE_MAP[key])});
}
export = Colorify;
// #endregion






function ANSI(...codes:(number|ControlCode|readonly number[])[]):string {
	const cmd:number[] = [];
	for(let code of codes) {
		if ( code instanceof ControlCode ) {
			code = ControlCodePrivates.get(code)!;
		}

		cmd.push(...(Array.isArray(code)?code:[code]));
	}
	return `\u001b[${cmd.join(';')}m`;
}
function ANSIVT100Renderer(strings:ReadonlyArray<string|ControlCode>, ...args:any[]):string;
function ANSIVT100Renderer(...parts:any[]):string;
function ANSIVT100Renderer(arg1:any|ReadonlyArray<string|ControlCode>, ...args:any[]):string {
	// Tempalte function mode
	let result_string = '';
	if ( Array.isArray(arg1) ) {
		const plain_strings = arg1;
		const parts = args;

		
		let last_control_code = -1;
		result_string = result_string += plain_strings[0];

		for(let i=1; i<plain_strings.length; i++) {
			const part = parts[i-1];
			if ( part instanceof ControlCode ) {
				last_control_code = ControlCodePrivates.get(part)![0];
			}
			result_string += ('' + part) + plain_strings[i];
		}

		if ( last_control_code !== 0 && Colorify.auto_clear ) {
			result_string += ANSI(0);
		}
	}
	else {
		// Normal renderer
		args.unshift(arg1);
		for(const part of args) result_string = result_string + part;
	}
	
	return result_string;
}
