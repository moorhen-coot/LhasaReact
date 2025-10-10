
export function parseInchikeyDatabase(rawData: string): Map<string, [string, string]> {
    const inchiMap = new Map<string, [string, string]>();
    for (const line of rawData.split('\n')) {
        if(line.length === 0) continue;
        if(line.startsWith('#')) continue; // Skip comment lines
        const segments = line.split('\t');
        if (segments.length != 3) {
            throw new Error("Unexpected number of segments in InchiKey database line: " + line);
        }
        const inchiKey = segments[0];
        const monomer_id = segments[1];
        const chem_name = segments[2];
        inchiMap.set(inchiKey, [monomer_id, chem_name]);
    }
    return inchiMap;
}