import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../shared/ui/components';
import { MonthNavComponent } from '../../shared/month-nav/month-nav.component';
import { FixedCostsStore } from '../../core/store/fixed-costs.store';
import { AuthStore } from '../../core/store/auth.store';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { NotificationService } from '../../core/services/notification.service';
import { FixedCostEntry, FixedCostEntryInput } from '../../core/models/fixed-cost';
import {
  FixedCostFormComponent,
} from './create-fixed-cost/fixed-cost-form.component';
import { ConfirmBottomSheetDialogComponent } from '../../shared/ui-bottom-sheet/confirm-dialog/confirm-bottom-sheet-dialog.component';
import { ConfirmDialogData } from '../../shared/ui-bottom-sheet/confirm-dialog/confirm-dialog-data.model';
import { formatPeriodLabel } from '../../core/utils/dashboard.utils';
import { SelectedDate } from '../../core/models/dashboard';
import { FixedCostFormData } from '../../core/models/fixed-cost/fixed-cost-form-data';

function monthKeyOf(date: SelectedDate): string {
  return `${date.year}-${String(date.month + 1).padStart(2, '0')}`;
}

function labelFromMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return formatPeriodLabel({ year: y, month: m - 1 });
}

@Component({
  selector: 'app-fixed-costs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArsPipe, UiIconComponent, MonthNavComponent],
  templateUrl: './fixed-costs.component.html',
  styleUrl: './fixed-costs.component.scss',
})
export class FixedCostsComponent {
  private readonly store = inject(FixedCostsStore);
  readonly auth = inject(AuthStore);
  private readonly dialog = inject(BottomSheetService);
  private readonly notify = inject(NotificationService);

  private readonly today = new Date();
  readonly selected = signal<SelectedDate>({
    year: this.today.getFullYear(),
    month: this.today.getMonth(),
  });

  readonly monthKey = computed(() => monthKeyOf(this.selected()));
  readonly monthLabel = computed(() => formatPeriodLabel(this.selected()));
  readonly entries = computed(() => this.store.entriesForMonth(this.monthKey()));
  readonly status = computed(() => this.store.statusForMonth(this.monthKey()));
  readonly total = computed(() => this.store.totalForMonth(this.monthKey()));

  readonly statusCaption = computed(() => {
    const s = this.status();
    if (s.kind === 'edited') return 'Editado este mes';
    if (s.kind === 'inherited') return `Heredado de ${labelFromMonthKey(s.sourceMonthKey)}`;
    return 'Sin costos aún';
  });

  readonly canRevert = computed(() => this.status().kind === 'edited');

  previousMonth(): void {
    const { year, month } = this.selected();
    this.selected.set(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }

  nextMonth(): void {
    const { year, month } = this.selected();
    this.selected.set(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  trackEntry = (_: number, entry: FixedCostEntry) => entry.lineageId;

  create(): void {
    const ref = this.dialog.open<FixedCostFormData, FixedCostEntryInput>(
      FixedCostFormComponent,
      { title: 'Nuevo costo fijo', section: 'Costos fijos',
        maxWidth: '480px', data: { monthLabel: this.monthLabel(), entry: null } },
    );
    ref.afterClosed.subscribe(async (input) => {
      if (!input) return;
      await this.store.createForMonth(this.monthKey(), input);
      this.notify.success('Costo fijo agregado');
    });
  }

  edit(entry: FixedCostEntry): void {
    const ref = this.dialog.open<FixedCostFormData, FixedCostEntryInput>(
      FixedCostFormComponent,
      { title: 'Editar costo fijo', section: 'Costos fijos', maxWidth: '480px', data: { monthLabel: this.monthLabel(), entry } },
    );
    ref.afterClosed.subscribe(async (input) => {
      if (!input) return;
      await this.store.updateForMonth(this.monthKey(), entry.lineageId, input);
      this.notify.success('Costo fijo actualizado');
    });
  }

  confirmDelete(entry: FixedCostEntry, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmBottomSheetDialogComponent, {
      maxWidth: '420px',
      data: {
        title: 'Borrar costo fijo',
        message: `¿Seguro que querés borrar “${entry.name}” de ${this.monthLabel()}?`,
        confirmLabel: 'Borrar',
        destructive: true,
      },
    });
    ref.afterClosed.subscribe(async (confirmed) => {
      if (!confirmed) return;
      await this.store.deleteForMonth(this.monthKey(), entry.lineageId);
      this.notify.success('Costo fijo borrado');
    });
  }

  editFromIcon(entry: FixedCostEntry, event: Event): void {
    event.stopPropagation();
    this.edit(entry);
  }

  confirmRevert(): void {
    const dialogData = {
      title: 'Volver al mes anterior',
      message: `Se descartarán los cambios de ${this.monthLabel()} y se heredarán los costos del mes previo.`,
      confirmLabel: 'Volver',
      destructive: true,
    };
    const ref = this.dialog.open<ConfirmDialogData, boolean>(ConfirmBottomSheetDialogComponent, {
      title: dialogData.title,
      maxWidth: '420px',
      data: dialogData,
    });
    ref.afterClosed.subscribe(async (confirmed) => {
      if (!confirmed) return;
      await this.store.revertMonthToInherited(this.monthKey());
      this.notify.success('Cambios del mes descartados');
    });
  }
}
