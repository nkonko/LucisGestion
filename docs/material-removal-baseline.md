# Baseline para Remover Angular Material

Fecha: 2026-04-27
Workspace: c:/Repositories/Lucis repo/Gestion/lucis-gestion
Angular: 21

## Objetivo
Definir la línea base técnica para retirar Angular Material de forma incremental, segura y medible.

## Inventario de Componentes TS con imports de Angular Material
Total: 16 componentes

1. src/app/features/customers/customer-form.component.ts
2. src/app/features/customers/customers.component.ts
3. src/app/features/dashboard/dashboard.component.ts
4. src/app/features/fixed-costs/fixed-cost-form.component.ts
5. src/app/features/fixed-costs/fixed-costs.component.ts
6. src/app/features/ingredients/ingredient-form.component.ts
7. src/app/features/ingredients/ingredients.component.ts
8. src/app/features/ingredients/price-history.component.ts
9. src/app/features/login/login.component.ts
10. src/app/features/recipes/catalog-dialog.component.ts
11. src/app/features/recipes/recipe-form.component.ts
12. src/app/features/recipes/recipes.component.ts
13. src/app/features/sales/sale-form.component.ts
14. src/app/features/sales/sales.component.ts
15. src/app/features/stock/stock.component.ts
16. src/app/shared/layout/layout.component.ts

## Inventario de Templates HTML con uso de mat-*
Total: 17 templates

1. src/app/features/customers/customer-form.component.html
2. src/app/features/customers/customers.component.html
3. src/app/features/dashboard/dashboard.component.html
4. src/app/features/fixed-costs/fixed-cost-form.component.html
5. src/app/features/fixed-costs/fixed-costs.component.html
6. src/app/features/ingredients/ingredient-form.component.html
7. src/app/features/ingredients/ingredients.component.html
8. src/app/features/ingredients/price-history.component.html
9. src/app/features/login/login.component.html
10. src/app/features/recipes/catalog-dialog.component.html
11. src/app/features/recipes/recipe-form.component.html
12. src/app/features/recipes/recipes.component.html
13. src/app/features/sales/sale-form.component.html
14. src/app/features/sales/sales.component.html
15. src/app/features/stock/stock.component.html
16. src/app/shared/layout/layout.component.html
17. src/index.html

## Inventario de Módulos Material Detectados
- MatAutocompleteModule
- MatBadgeModule
- MatButtonModule
- MatButtonToggleModule
- MatCardModule
- MatChipsModule
- MatDatepickerModule
- MatDialog y MatDialogModule
- MatDialogRef y MAT_DIALOG_DATA
- MatDividerModule
- MatFormFieldModule
- MatIconModule
- MatInputModule
- MatListModule
- MatMenuModule
- MatNativeDateModule
- MatProgressBarModule
- MatProgressSpinnerModule
- MatSelectModule
- MatSnackBar
- MatTabsModule
- MatToolbarModule

## Acoples Globales de Material
- package.json contiene: @angular/material, @angular/cdk, @angular/animations
- src/styles.scss importa @angular/material y usa @include mat.theme(...)
- src/index.html carga Material Icons por CDN
- src/app/app.config.ts provee provideAnimationsAsync()
- src/app/core/services/notification.service.ts depende de MatSnackBar

## Tabla de Reemplazo Recomendada
| Uso actual Material | Reemplazo objetivo | Notas |
|---|---|---|
| MatDialog, MatDialogRef, MAT_DIALOG_DATA | DialogService + ui-modal propio | Mantener foco inicial, Escape, focus return |
| MatSnackBar | ui-toast + NotificationService interno | Conservar API success/error/errorFrom |
| mat-form-field + matInput | ui-input + input nativo | Labels, help text y errores accesibles |
| mat-select | ui-select o select nativo avanzado | Compatibilidad con keyboard y aria |
| mat-autocomplete | combobox accesible propio | Listbox con navegación por teclado |
| MatDatepicker | input type=date o datepicker propio | Definir formato y zona horaria |
| MatCard | ui-card + clases utilitarias | Sin dependencia funcional |
| MatChips | ui-chip o tags HTML | Mantener contraste AA |
| MatTabs | tabs accesibles propios | aria-controls + roving tabindex |
| MatToolbar/MatMenu/MatBadge | layout/nav propios | Reemplazar iconografía Material Icons |
| MatProgressBar/Spinner | componentes de loading propios | aria-busy y live regions donde aplique |
| MatButtonToggle | segmented control propio | Estados pressed y keyboard support |
| MatIconModule + Material Icons CDN | set SVG local (no Material) | Evitar dependencia externa del font CDN |

## Baseline de Comandos

### Build
- Comando: npm run build
- Estado: OK
- Duración aproximada: 9.7 s
- Observación: generación correcta en dist/lucis-gestion

### Test
- Comando: npm run test -- --watch=false --browsers=ChromeHeadless
- Estado: FAIL
- Duración aproximada: 1.8 s
- Error clave: faltan paquetes para browsers en Vitest (@vitest/browser-playwright, @vitest/browser-webdriverio o @vitest/browser-preview)

## Riesgos iniciales detectados
1. Migración de formularios complejos (recipe-form y sale-form) por uso combinado de dialog, select, autocomplete y validaciones.
2. Riesgo de regresión UX en navegación y menús del layout compartido.
3. Dependencia implícita de animaciones al quitar provideAnimationsAsync().
4. Cobertura de tests no verificable hoy por configuración incompleta de entorno de navegador.

## Definición de Done del Prompt 1
- Baseline documental creado.
- Inventario de acoples Material consolidado.
- Build ejecutado y registrado.
- Estado de tests registrado con causa de falla.
