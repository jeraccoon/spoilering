export type ContentType = "libro" | "serie" | "pelicula";

export type LongSummarySection = {
  title: string;
  paragraphs: string[];
};

export type SpoileringContent = {
  title: string;
  slug: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  longSummary: LongSummarySection[];
};

export const contents: SpoileringContent[] = [
  {
    "title": "Harry Potter y la piedra filosofal",
    "slug": "harry-potter-piedra-filosofal",
    "type": "libro",
    "year": "1997",
    "shortSummary": "Harry descubre que es mago, entra en Hogwarts y evita que Voldemort recupere poder usando la piedra filosofal.",
    "longSummary": [
      {
        "title": "Inicio",
        "paragraphs": [
          "Harry Potter vive con sus tíos, los Dursley, que lo tratan como una molestia y le ocultan la verdad sobre sus padres. Poco antes de cumplir once años empieza a recibir cartas misteriosas, aunque sus tíos intentan impedir que las lea.",
          "Hagrid aparece para revelarle que Harry es un mago y que sus padres fueron asesinados por Lord Voldemort. Harry entra en el mundo mágico, compra sus materiales en el Callejón Diagon y viaja a Hogwarts, donde conoce a Ron Weasley y Hermione Granger."
        ]
      },
      {
        "title": "Desarrollo",
        "paragraphs": [
          "En Hogwarts, Harry entra en Gryffindor, descubre su talento para el quidditch y empieza a sospechar que algo peligroso está escondido dentro del castillo. Ese objeto es la piedra filosofal, capaz de producir el elixir de la vida.",
          "Harry, Ron y Hermione creen que Snape quiere robar la piedra para ayudar a Voldemort. El trío investiga, descubre a Fluffy, el perro de tres cabezas, y entiende que la piedra está protegida por varias pruebas mágicas."
        ]
      },
      {
        "title": "Final",
        "paragraphs": [
          "Harry, Ron y Hermione atraviesan las pruebas. Ron se sacrifica en una partida de ajedrez mágico para que los demás sigan, Hermione resuelve un acertijo de pociones y Harry llega solo a la sala final.",
          "Allí descubre que el verdadero enemigo es Quirrell. Voldemort vive unido a él, oculto bajo su turbante. La piedra aparece en el bolsillo de Harry porque no desea usarla, solo protegerla.",
          "Quirrell no puede tocar a Harry sin quemarse por la protección que dejó su madre al sacrificarse. Quirrell muere, Voldemort huye sin cuerpo y Dumbledore destruye la piedra. Al final, Gryffindor gana la Copa de las Casas."
        ]
      }
    ]
  },
  {
    "title": "Breaking Bad",
    "slug": "breaking-bad",
    "type": "serie",
    "year": "2008",
    "shortSummary": "Walter White pasa de profesor enfermo y desesperado a narcotraficante temido bajo el nombre de Heisenberg.",
    "longSummary": [
      {
        "title": "Inicio",
        "paragraphs": [
          "Walter White es un profesor de química con una vida frustrante. Tras recibir un diagnóstico de cáncer de pulmón, decide fabricar metanfetamina para dejar dinero a su familia antes de morir.",
          "Se asocia con Jesse Pinkman, un antiguo alumno que conoce el mercado de la droga. Al principio Walter justifica todo como una decisión práctica, pero pronto descubre que el poder y el riesgo le atraen."
        ]
      },
      {
        "title": "Desarrollo",
        "paragraphs": [
          "Walter adopta la identidad de Heisenberg y toma decisiones cada vez más violentas para proteger su negocio. Manipula a Jesse, miente a su familia y se enfrenta a criminales más peligrosos.",
          "Su cuñado Hank, agente de la DEA, empieza a acercarse a la verdad. Mientras tanto, Walter deja de actuar por necesidad económica y empieza a actuar por orgullo, control y ambición."
        ]
      },
      {
        "title": "Final",
        "paragraphs": [
          "Hank descubre que Walter es Heisenberg y acaba asesinado por una banda neonazi que roba gran parte del dinero. Walter huye, pero vuelve para cerrar sus cuentas pendientes.",
          "En el final, Walter libera a Jesse, mata a los neonazis con una ametralladora escondida y muere herido en el laboratorio. Antes admite que no lo hizo solo por su familia: lo hizo porque le gustaba y era bueno en ello."
        ]
      }
    ]
  },
  {
    "title": "El club de la lucha",
    "slug": "el-club-de-la-lucha",
    "type": "pelicula",
    "year": "1999",
    "shortSummary": "Un hombre insomne crea una personalidad alternativa que convierte su vacío vital en una revolución violenta.",
    "longSummary": [
      {
        "title": "Inicio",
        "paragraphs": [
          "El narrador vive atrapado en una rutina vacía, con insomnio y una obsesión por comprar muebles y objetos. Para sentir algo, empieza a asistir a grupos de apoyo de enfermedades que no padece.",
          "Conoce a Marla Singer, que también finge en esos grupos, y después a Tyler Durden, un vendedor de jabón carismático que desprecia el consumo, la comodidad y la vida domesticada."
        ]
      },
      {
        "title": "Desarrollo",
        "paragraphs": [
          "El narrador y Tyler empiezan a pelear por placer y fundan el club de la lucha, un espacio secreto donde hombres frustrados descargan rabia. El club crece y se transforma en el Proyecto Mayhem.",
          "Tyler gana seguidores, organiza ataques contra símbolos financieros y parece actuar con una libertad absoluta. El narrador empieza a perder memoria y descubre que la situación se le ha ido completamente de las manos."
        ]
      },
      {
        "title": "Final",
        "paragraphs": [
          "El gran giro es que Tyler no existe como persona independiente: es una personalidad creada por el narrador. Todo lo que Tyler ha hecho, lo ha hecho realmente él.",
          "El narrador intenta detener el plan, se dispara a sí mismo para romper el control de Tyler y sobrevive. Al final, varios edificios explotan mientras él y Marla observan cómo el proyecto se cumple parcialmente."
        ]
      }
    ]
  },
  {
    "title": "Matrix",
    "slug": "matrix",
    "type": "pelicula",
    "year": "1999",
    "shortSummary": "'Matrix' es una película de ciencia ficción que explora la naturaleza de la realidad y la lucha entre humanos y máquinas en un futuro distópico.",
    "longSummary": [
      {
        "title": "Inicio",
        "paragraphs": [
          "La historia comienza con Thomas Anderson, un programador que lleva una vida doble como hacker bajo el alias 'Neo'. Es contactado por un grupo de rebeldes liderados por Morfeo, quienes le revelan que el mundo en el que vive es en realidad una simulación creada por máquinas."
        ]
      },
      {
        "title": "Desarrollo",
        "paragraphs": [
          "Neo es introducido a la verdad sobre Matrix, un mundo donde la humanidad está atrapada en una ilusión mientras sus cuerpos son utilizados como fuente de energía por las máquinas. A medida que se entrena para entender su potencial, se enfrenta a agentes de control que protegen la Matrix, especialmente al agente Smith. Neo comienza a desarrollar habilidades extraordinarias en el mundo simulado."
        ]
      },
      {
        "title": "Final",
        "paragraphs": [
          "En un clímax lleno de acción, Neo debe confrontar al agente Smith y a su propia identidad como 'El Elegido', quien tiene el poder de cambiar las reglas dentro de la Matrix. Al final, Neo logra liberar su potencial, desafiando las limitaciones impuestas y asegurando una lucha continua contra el dominio de las máquinas. La película cierra con la promesa de un futuro de resistencia y esperanza."
        ]
      }
    ]
  }
];

export function getContentBySlug(slug: string) {
  return contents.find((content) => content.slug === slug);
}

export function getContentTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    libro: "Libro",
    serie: "Serie",
    pelicula: "Película",
  };

  return labels[type];
}
