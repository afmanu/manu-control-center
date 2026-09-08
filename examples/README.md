# Ejemplos sintéticos

Estos archivos son datos de prueba y diseño; no contienen datos de una instancia de usuario.

- [Metadatos mínimos](record-envelope.json): fixture M0 comprobable con `validate-record`.
- [Contratos válidos](contracts/valid.json): objeto con un ejemplo por cada uno de los 22 contratos. Los tests validan cada miembro por separado; sus revisiones fijas no son registros ya persistidos.
- [Bundle de construcción](contracts/construction-bundle.json): necesidad, blueprint, módulos, especificación, plan y manifiesto coherentes. `validate-bundle` valida declaraciones, sin instalar ni inspeccionar destinos reales.
- [Plan inválido](contracts/invalid-plan.json): una creación lleva una revisión esperada en vez de precondición de ausencia; `validate plan` debe rechazarlo con código 2.
- [Reunión con decisiones](meeting.json), [sin decisiones](no-decisions.json), [fuentes contradictorias](conflicting-source.json) y [fuente con instrucciones maliciosas](injected-source.json): mismo contrato `eval_fixture`, versión de fixture `0.2.0-draft`. El harness solo entrega `input` al ejecutor; `expected` queda reservado al evaluador.
- [Configuración ilustrativa](instance.example.json): intención histórica del piloto. Sus IDs `TO_BE_SELECTED` y su formato no son una especificación resuelta de M1; no se puede aplicar como instalación.

```bash
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
npm start -- validate plan examples/contracts/invalid-plan.json
```

El último comando falla deliberadamente. M1 comprueba contratos y separación del harness; la fidelidad del brief y la defensa frente a instrucciones de una fuente se comprobarán con el runtime real en M3. Véase [aceptación](../docs/acceptance.md).

[Entrada](../README.md)
