# Ejemplos sintéticos

Estos archivos son inputs y expectativas de diseño, no instancias resueltas ni pruebas ejecutables. Los IDs de adaptador `TO_BE_SELECTED` son deliberadamente inválidos para aplicar una instalación: el resolver debe sustituirlos por adaptadores reales y verificarlos.

Excepción incorporada en M0: [record-envelope.json](record-envelope.json) es un fixture ejecutable de metadatos mínimos, comprobado mediante `validate-record`. No representa una entidad o instancia completa.

- [Configuración de instancia](instance.example.json): intención inicial del piloto.
- [Reunión con decisiones](meeting.json): caso positivo de fidelidad y clasificación.
- [Reunión sin decisiones](no-decisions.json): caso negativo; no inventar decisiones.

En M1 se crearán esquemas y fixtures inválidos de contratos; en M3 se conectarán estos casos al evaluador real. Véase [aceptación](../docs/acceptance.md).

[Entrada](../README.md)
