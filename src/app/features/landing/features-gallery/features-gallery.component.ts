import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string;
}

@Component({
  selector: 'app-features-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-gallery.component.html',
  styleUrls: ['./features-gallery.component.scss'],
  host: {
    class: 'features-gallery-container',
  },
})
export class FeaturesGalleryComponent {
  readonly features: Feature[] = [
    {
      id: 'dashboard',
      title: 'Dashboard integral',
      description: 'Visualiza tus métricas financieras, stock bajo e ingresos en tiempo real',
      image: '/images/features/dashboard.png',
      icon: '📊',
    },
    {
      id: 'recetas',
      title: 'Gestión de recetas',
      description: 'Organiza tus recetas con costos calculados automáticamente y márgenes claros',
      image: '/images/features/recetas.png',
      icon: '🍰',
    },
    {
      id: 'ventas',
      title: 'Control de ventas',
      description: 'Registra cada operación con clientes y analiza tus ingresos por período',
      image: '/images/features/ventas.png',
      icon: '💰',
    },
    {
      id: 'stock',
      title: 'Gestión de stock',
      description: 'Controla tu inventario en tiempo real y recibe alertas de stock bajo',
      image: '/images/features/stock.png',
      icon: '📦',
    },
  ];

  selectedFeature = this.features[0];

  selectFeature(feature: Feature): void {
    this.selectedFeature = feature;
  }
}
