export type ContentSection = {
  title: string;
  paragraphs: string[];
};

export type SpoileringContent = {
  slug: string;
  title: string;
  type: string;
  year: string;
  readTime: string;
  description: string;
  sections: ContentSection[];
};

export const contents: SpoileringContent[] = [
  {
    slug: "harry-potter-piedra-filosofal",
    title: "Harry Potter y la piedra filosofal",
    type: "Libro",
    year: "1997",
    readTime: "7 min",
    description:
      "Harry descubre que es mago, entra en Hogwarts y se enfrenta al regreso incompleto de Voldemort.",
    sections: [
      {
        title: "Inicio",
        paragraphs: [
          "Harry Potter vive con sus tíos, los Dursley, que lo tratan como una molestia y le ocultan la verdad sobre sus padres. Poco antes de cumplir once años empieza a recibir cartas misteriosas, aunque sus tíos intentan impedir que las lea.",
          "Hagrid aparece para revelarle que Harry es un mago y que sus padres fueron asesinados por Lord Voldemort, un mago oscuro que perdió su poder al intentar matar también a Harry cuando era un bebé. Harry entra en el mundo mágico, compra sus materiales y viaja a Hogwarts.",
        ],
      },
      {
        title: "Desarrollo",
        paragraphs: [
          "En Hogwarts, Harry conoce a Ron Weasley y Hermione Granger, entra en Gryffindor y descubre que tiene talento para el quidditch. También aprende que en el castillo hay algo muy valioso protegido por varios profesores: la piedra filosofal.",
          "Harry, Ron y Hermione sospechan que Snape quiere robar la piedra para ayudar a Voldemort. Mientras investigan, descubren que está custodiada por Fluffy, un perro de tres cabezas, y por una serie de pruebas mágicas.",
        ],
      },
      {
        title: "Final",
        paragraphs: [
          "Harry, Ron y Hermione atraviesan las pruebas. Ron se sacrifica en una partida de ajedrez mágico para que Harry y Hermione sigan adelante, y Hermione resuelve un acertijo de pociones. Harry continúa solo hasta la última sala.",
          "Allí descubre que el verdadero enemigo no era Snape, sino Quirrell. Voldemort vive de forma débil unido a él. La piedra aparece en el bolsillo de Harry porque no desea usarla para sí mismo.",
          "Quirrell no puede tocar a Harry sin quemarse por la protección que dejó su madre al sacrificarse. Quirrell muere, Voldemort huye sin cuerpo y Dumbledore decide destruir la piedra. Gryffindor gana la Copa de las Casas al final del curso.",
        ],
      },
    ],
  },
  {
    slug: "el-club-de-la-lucha",
    title: "El club de la lucha",
    type: "Película",
    year: "1999",
    readTime: "6 min",
    description:
      "Un hombre insomne crea una vida alternativa que acaba convirtiéndose en un movimiento violento.",
    sections: [
      {
        title: "Inicio",
        paragraphs: [
          "El narrador vive atrapado en una rutina vacía, con insomnio y una obsesión por comprar cosas. Para sentir algo, empieza a asistir a grupos de apoyo de enfermedades que no padece.",
          "Conoce a Marla Singer, que también finge en esos grupos, y más tarde a Tyler Durden, un vendedor de jabón carismático y radical que desprecia la vida cómoda y consumista.",
        ],
      },
      {
        title: "Desarrollo",
        paragraphs: [
          "El narrador y Tyler empiezan a pelear por placer y fundan el club de la lucha, un espacio secreto donde hombres frustrados descargan rabia. El club crece y se transforma en el Proyecto Mayhem.",
          "Tyler gana cada vez más control, recluta seguidores y prepara ataques contra símbolos financieros. El narrador empieza a perder memoria y descubre que la situación se le ha ido de las manos.",
        ],
      },
      {
        title: "Final",
        paragraphs: [
          "El giro principal es que Tyler no existe como persona independiente: es una personalidad creada por el narrador. Todo lo que Tyler ha hecho, lo ha hecho realmente él.",
          "El narrador intenta detener el plan, se dispara a sí mismo para romper el control de Tyler y sobrevive. Al final, los edificios explotan mientras él y Marla observan cómo el proyecto de Tyler se cumple parcialmente.",
        ],
      },
    ],
  },
  {
    slug: "breaking-bad",
    title: "Breaking Bad",
    type: "Serie",
    year: "2008",
    readTime: "12 min",
    description:
      "Walter White pasa de profesor desesperado a criminal temido bajo el nombre de Heisenberg.",
    sections: [
      {
        title: "Inicio",
        paragraphs: [
          "Walter White es un profesor de química con una vida gris. Cuando le diagnostican cáncer de pulmón, decide fabricar metanfetamina para dejar dinero a su familia.",
          "Se asocia con Jesse Pinkman, un antiguo alumno, y juntos entran en un mundo criminal que Walter cree poder controlar gracias a su inteligencia.",
        ],
      },
      {
        title: "Desarrollo",
        paragraphs: [
          "Walter va tomando decisiones cada vez más violentas para proteger su negocio y su ego. Se enfrenta a traficantes, manipula a Jesse y construye la identidad de Heisenberg.",
          "Su familia se rompe, Hank empieza a acercarse a la verdad y Walter deja de actuar solo por necesidad. La ambición y el orgullo se convierten en el centro de todo.",
        ],
      },
      {
        title: "Final",
        paragraphs: [
          "Hank descubre que Walter es Heisenberg y acaba asesinado por una banda neonazi que también roba gran parte del dinero. Walter huye, pero vuelve para cerrar sus cuentas pendientes.",
          "En el final, libera a Jesse, mata a los neonazis con una ametralladora escondida y muere herido en el laboratorio. Antes admite que no lo hizo solo por su familia: lo hizo porque le gustaba y era bueno en ello.",
        ],
      },
    ],
  },
  {
    slug: "dune",
    title: "Dune",
    type: "Libro y película",
    year: "1965",
    readTime: "8 min",
    description:
      "Paul Atreides sobrevive a una traición imperial y se convierte en líder mesiánico en Arrakis.",
    sections: [
      {
        title: "Inicio",
        paragraphs: [
          "La Casa Atreides recibe el control de Arrakis, el planeta desértico donde se produce la especia, la sustancia más valiosa del universo. La decisión parece un honor, pero es una trampa política.",
          "El duque Leto intenta gobernar con justicia, mientras Paul Atreides empieza a tener visiones relacionadas con los Fremen y con un futuro marcado por la guerra religiosa.",
        ],
      },
      {
        title: "Desarrollo",
        paragraphs: [
          "Los Harkonnen atacan Arrakis con apoyo secreto del emperador. Leto muere, la Casa Atreides cae y Paul huye al desierto con su madre, Jessica.",
          "Paul y Jessica son acogidos por los Fremen. Paul adopta el nombre Muad'Dib, demuestra capacidades políticas y religiosas, y empieza a convertirse en una figura mesiánica que él mismo teme.",
        ],
      },
      {
        title: "Final",
        paragraphs: [
          "Paul lidera a los Fremen contra los Harkonnen y el emperador. Usa su control sobre Arrakis y la especia para forzar una victoria política total.",
          "Al final, Paul derrota a sus enemigos y toma el poder mediante un matrimonio estratégico con la princesa Irulan. Gana, pero también abre la puerta a la guerra santa que veía en sus visiones.",
        ],
      },
    ],
  },
];

export function getContentBySlug(slug: string) {
  return contents.find((content) => content.slug === slug);
}
