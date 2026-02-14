🎨 Identidad Cromática: Sistema "Soft Focus"

Esta paleta no usa colores sólidos planos; vive en los degradados y las transparencias. Sin embargo, necesitamos códigos HEX base para botones, textos y bordes.

1. Colores de Marca (The Core Gradient)

Estos tres colores forman el alma del logotipo y se usan en los botones principales (Call to Action) y elementos destacados.

Clair Violet (Inteligencia): Un violeta eléctrico pero lechoso. Representa a la IA (Llama-3).

HEX: #8B5CF6 (Pantone Digital Lavender)

Uso: Botones principales, iconos activos, textos destacados en Dark Mode.

Flux Cyan (Claridad): Un azul cian que sugiere transparencia y verdad.

HEX: #06B6D4 (Cyan limpio)

Uso: Gráficos de ingresos, bordes de tarjetas activas, estados de "carga".

Mint Spark (Crecimiento): Un verde menta fresco, nunca "verde dinero viejo".

HEX: #34D399 (Emerald soft)

Uso: Indicadores de ahorro positivo, notificaciones de éxito, balance a favor.

💡 Tip de Branding: En la web, usa un degradado lineal suave de Clair Violet a Flux Cyan para los botones de "Registrarse". Da sensación de movimiento.

2. Paleta Funcional (Semántica)

Para estados de error o alerta, no usaremos rojos agresivos. Mantendremos la vibra "casual".

Error / Gasto Alto: #F472B6 (Soft Rose). En lugar de rojo sangre, usamos un rosa intenso. Alerta sin gritar.

Warning / Límite Cerca: #FBBF24 (Warm Amber). Un ámbar cálido y amigable.

Success / Meta Cumplida: #10B981 (Vibrant Emerald). Un poco más oscuro que el Mint Spark para que se lea bien el texto.

3. Sistema de Superficies (Light vs. Dark Mode)

Aquí es donde ocurre la magia del Glassmorphism. La clave no es el color sólido, sino la opacidad y el desenfoque (backdrop-filter: blur).

☀️ LIGHT MODE: "Porcelain & Vapor"
Queremos que se sienta como una mañana fresca. Limpieza clínica pero acogedora.

Elemento	Color HEX	Opacidad Sugerida	Efecto
Fondo Base	#F3F4F6	100%	Un gris azulado casi blanco (Cool Gray). Nunca blanco puro (#FFFFFF) para no cansar la vista.
Tarjetas (Glass)	#FFFFFF	60-80%	blur(12px) + Borde sutil blanco al 40%.
Texto Principal	#1F2937	100%	Un gris oscuro (Charcoal), nunca negro puro.
Texto Secundario	#6B7280	100%	Gris medio para fechas o categorías.
Sombras	#8B5CF6	15%	Sombras teñidas de violeta, no negras, para dar un "glow" mágico.
🌙 DARK MODE: "Deep Space & Bioluminescence"
Queremos que se sienta premium, profundo y relajante para los ojos por la noche. Los colores neón (Violet, Cyan) brillarán sobre el fondo oscuro.

Elemento	Color HEX	Opacidad Sugerida	Efecto
Fondo Base	#0F172A	100%	Un azul marino muy profundo (Slate 900). Evita el negro #000000 para mantener la profundidad.
Tarjetas (Glass)	#1E293B	50-70%	blur(20px) + Borde sutil blanco al 10%.
Texto Principal	#F8FAFC	100%	Blanco hueso (Slate 50).
Texto Secundario	#94A3B8	100%	Gris azulado claro.
Glow	#06B6D4	20%	Resplandores cian detrás de las tarjetas activas.
🚀 Implementación CSS (Snippet Rápido)

Para que el equipo de desarrollo entienda el "vibe", entrégales estas variables CSS base:

CSS
:root {
  /* Brand Core */
  --primary-violet: #8B5CF6;
  --primary-cyan: #06B6D4;
  --accent-mint: #34D399;
  
  /* Brand Gradient */
  --brand-gradient: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
}

/* Light Mode Theme */
[data-theme='light'] {
  --bg-app: #F3F4F6;
  --surface-glass: rgba(255, 255, 255, 0.7);
  --text-main: #1F2937;
  --glass-border: 1px solid rgba(255, 255, 255, 0.5);
  --shadow-glow: 0 8px 32px rgba(139, 92, 246, 0.15); /* Sombra violeta */
}

/* Dark Mode Theme */
[data-theme='dark'] {
  --bg-app: #0F172A;
  --surface-glass: rgba(30, 41, 59, 0.6);
  --text-main: #F8FAFC;
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --shadow-glow: 0 8px 32px rgba(6, 182, 212, 0.2); /* Sombra cian */
}
