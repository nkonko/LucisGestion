import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Lucis Gestión</h1>
          <p class="subtitle">Gestión integral para tu pastelería artesanal</p>
          <p class="description">
            Controla costos, gestiona stock y maximiza tus ventas con una plataforma diseñada
            específicamente para pastelerías
          </p>
          <div class="cta-buttons">
            <a routerLink="/login" class="btn btn-primary">Ingresar</a>
            <a routerLink="/demo/dashboard" class="btn btn-secondary">Modo Demo</a>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <h2>Características principales</h2>
        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Dashboard integral</h3>
            <p>Visualiza métricas clave de tu negocio en tiempo real</p>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon">🧁</div>
            <h3>Gestión de recetas</h3>
            <p>Crea y administra tus recetas con cálculo automático de costos</p>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon">🛒</div>
            <h3>Control de ventas</h3>
            <p>Registra y analiza todas tus ventas con detalles de productos</p>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>Gestión de stock</h3>
            <p>Controla inventario de ingredientes y productos terminados</p>
          </div>

          <!-- Feature 5 -->
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>Reportes financieros</h3>
            <p>Análisis detallados de rentabilidad y márgenes de ganancia</p>
          </div>

          <!-- Feature 6 -->
          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3>Gestión de clientes</h3>
            <p>Mantén registro de clientes y sus preferencias</p>
          </div>

          <!-- Feature 7 -->
          <div class="feature-card">
            <div class="feature-icon">💸</div>
            <h3>Costos fijos</h3>
            <p>Calcula y controla tus costos operativos mensuales</p>
          </div>

          <!-- Feature 8 -->
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>Backup y restore</h3>
            <p>Respalda y restaura tus datos de forma segura</p>
          </div>
        </div>
      </section>

      <!-- Benefits Section -->
      <section class="benefits">
        <h2>¿Por qué elegir Lucis Gestión?</h2>
        <div class="benefits-list">
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Diseñado para pastelerías</h4>
              <p>Herramientas específicas para el rubro, no genéricas</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Fácil de usar</h4>
              <p>Interfaz intuitiva que no requiere capacitación compleja</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Análisis en tiempo real</h4>
              <p>Toma decisiones con información actualizada al instante</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Seguridad de datos</h4>
              <p>Tus datos están seguros con backup automático</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Acceso desde cualquier lugar</h4>
              <p>Gestiona tu negocio desde dispositivos conectados</p>
            </div>
          </div>
          <div class="benefit-item">
            <span class="benefit-check">✓</span>
            <div>
              <h4>Mejora rentabilidad</h4>
              <p>Identifica ineficiencias y aumenta tus márgenes de ganancia</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <h2>Comienza hoy</h2>
        <p>Optimiza la gestión de tu pastelería con Lucis Gestión</p>
        <a routerLink="/login" class="btn btn-primary btn-large">Entrar a la plataforma</a>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <p>&copy; 2024 Lucis Gestión. Todos los derechos reservados.</p>
      </footer>
    </div>
  `,
  styles: `
    .landing-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: white;
    }

    .hero-content {
      max-width: 800px;
      animation: fadeInUp 0.8s ease-out;
    }

    .hero h1 {
      font-size: 4rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .subtitle {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      font-weight: 300;
    }

    .description {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.95;
      line-height: 1.6;
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Features Section */
    .features {
      padding: 4rem 2rem;
      background: white;
    }

    .features h2 {
      font-size: 2.5rem;
      text-align: center;
      margin-bottom: 3rem;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .feature-card {
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid #e0e0e0;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
      color: #667eea;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
    }

    /* Benefits Section */
    .benefits {
      padding: 4rem 2rem;
      background: #f8f9fa;
    }

    .benefits h2 {
      font-size: 2.5rem;
      text-align: center;
      margin-bottom: 3rem;
      color: #333;
    }

    .benefits-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .benefit-item {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: box-shadow 0.3s ease;
    }

    .benefit-item:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .benefit-check {
      font-size: 1.8rem;
      color: #667eea;
      font-weight: bold;
      flex-shrink: 0;
    }

    .benefit-item h4 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .benefit-item p {
      color: #666;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* CTA Section */
    .cta-section {
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }

    .cta-section h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .cta-section p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.95;
    }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 0.8rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #f0f1ff;
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    }

    .btn-large {
      padding: 1rem 3rem;
      font-size: 1.1rem;
    }

    /* Footer */
    .footer {
      padding: 2rem;
      background: rgba(0, 0, 0, 0.1);
      color: white;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2.5rem;
      }

      .subtitle {
        font-size: 1.2rem;
      }

      .features h2,
      .benefits h2,
      .cta-section h2 {
        font-size: 2rem;
      }

      .hero {
        min-height: auto;
        padding: 3rem 1rem;
      }

      .cta-buttons {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `,
})
export class LandingComponent {}
