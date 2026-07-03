import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BrandHeaderComponent } from '../../shared/layout/brand-header/brand-header.component';
import { RotatingTitleComponent } from '../../shared/rotating-title/rotating-title.component';
import type { ShowcaseItem } from './models/showcase-item.model';
import { SplitMediaCardComponent } from '../../shared/ui/components/split-media-card/split-media-card.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, BrandHeaderComponent, RotatingTitleComponent, SplitMediaCardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnDestroy {
  protected readonly menuOpen = signal(false);
  protected readonly menuClosing = signal(false);
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly heroTexts = [
    'Impulsá tus ventas con el control total de todo tu negocio',
    'Controla tus ventas costos, inventario y clientes en una sola plataforma',
    'Te cuesta seguir la economia de tu empresa? Proba nuestra solucion',
    'Reportes y informacion sin esfuerzo',
  ];

  protected readonly showcaseItems: ShowcaseItem[] = [
    {
      id: 'operacion',
      eyebrow: '🧁',
      title: 'Dashboard Integral',
      description: 'Visualiza métricas clave y oportunidades de mejora al instante. Es como asomarse al mostrador y ver exactamente qué pasteles se están vendiendo más hoy.',
      imageSrc: '/images/features/dashboard.png',
      imageAlt: 'Tablero de métricas clave para la operación del negocio',
      imagePosition: 'left',
    },
    {
      id: 'gestion',
      eyebrow: '📖',
      title: 'Gestión de Recetas',
      description: 'Calcula costos automáticamente por receta y por porción. No más dudas de cuánto te costó ese pastel de tres leches; costea cada gramo de harina y chocolate sin esfuerzo.',
      imageSrc: '/images/features/recetas.png',
      imageAlt: 'Panel de recetas y costos para el negocio',
      imagePosition: 'right',
    },
    {
      id: 'indicadores',
      eyebrow: '💰',
      title: 'Control de Ventas',
      description: 'Registra cada operación y analiza el comportamiento de clientes. El registro perfecto de cada pedido personalizado, mesa o venta al mostrador para saber qué endulza más a tus clientes.',
      imageSrc: '/images/features/ventas.png',
      imageAlt: 'Caja registradora y seguimiento de ventas del negocio',
      imagePosition: 'left',
    },
    {
      id: 'stock',
      eyebrow: '📦',
      title: 'Gestión de Stock',
      description: 'Evita quiebres y sobrecompras con alertas y movimientos claros. Que nunca te falte mantequilla un sábado por la mañana ni se te venza la crema para batir.',
      imageSrc: '/images/features/stock.png',
      imageAlt: 'Despensa organizada para controlar inventario y stock',
      imagePosition: 'right',
    },
    {
      id: 'reportes',
      eyebrow: '📈',
      title: 'Reportes Financieros',
      description: 'Entiende márgenes, costos fijos y rentabilidad por periodo. Descubre cuál es la verdadera "receta del éxito" y qué productos están dejando las mejores ganancias.',
      imageSrc: '/images/features/reportes.png',
      imageAlt: 'Panel financiero con reportes y márgenes del negocio',
      imagePosition: 'left',
    },
    {
      id: 'backup',
      eyebrow: '🛡️',
      title: 'La Receta Secreta Guardada bajo Llave',
      description: 'Mantén tus datos seguros para operar con tranquilidad. Porque tus recetas y tus números valen oro. Si algo pasa, tu información está tan a salvo como una receta familiar secreta.',
      imageSrc: '/images/features/backup.png',
      imageAlt: 'Respaldo seguro de datos y restauración',
      imagePosition: 'right',
    },
  ];

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }

    this.clearCloseTimer();
    this.menuClosing.set(false);
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    if (!this.menuOpen() && !this.menuClosing()) {
      return;
    }

    this.clearCloseTimer();
    this.menuOpen.set(false);
    this.menuClosing.set(true);

    this.closeTimer = setTimeout(() => {
      this.menuClosing.set(false);
      this.closeTimer = null;
    }, 460);
  }

  protected onMenuLinkClick(): void {
    this.closeMenu();
  }

  ngOnDestroy(): void {
    this.clearCloseTimer();
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) {
      return;
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}
