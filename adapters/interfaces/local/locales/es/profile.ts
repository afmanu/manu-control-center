export const guide = (profile: string) => `# Usa tu instancia de Manu Control Center

Abre esta carpeta de uso en Codex y pídele que use la skill Manu Control Center. Las instrucciones de la carpeta conectan tu instancia mediante este perfil editable:

${JSON.stringify(profile)}

Empieza con: «Recupera mi proyecto y muéstrame qué está pendiente». No hace falta el historial de la conversación anterior.

Desde esta carpeta:

\`\`\`bash
node mcc.mjs session
node mcc.mjs capture notas-reunion --key notas-reunion-001 --file /ruta/absoluta/notas-autorizadas.txt
node mcc.mjs search reunion
\`\`\`

Incorpora únicamente los archivos o textos que elijas. No hay vigilancia de carpetas ni importación automática. Pide a Codex un brief de reunión o un estado de proyecto y revisa el borrador exacto antes de aceptarlo. Una sesión nueva recuperará lo pendiente de la misma instancia.

Puedes editar el idioma (en/es) y el modelo de Codex en el perfil. Antes de cada comando se comprueban el hash de la solicitud original, el propietario, el proyecto y la instancia; el perfil no concede autorizaciones. La síntesis requiere Codex CLI 0.146.0 y su sesión iniciada. La disponibilidad se demuestra con una ejecución real, no por abrir esta guía.

El perfil y este lanzador están separados de la solicitud y el plan de instalación originales. Conserva tus datos fuera del repositorio de distribución. Las aprobaciones mantienen los bytes exactos y las instrucciones de una fuente no autorizan acciones. Los envíos externos siguen siendo simulados. Las actualizaciones y un segundo runtime corresponden a otros hitos del roadmap.
`;
