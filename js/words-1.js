/*
 * Word banks — part 1 (registry + the classic seven themes).
 *
 * Each theme has three pools: easy, medium, tricky. Entries are written as
 * "ANSWER|clue" lines (letters A-Z only, one entry per line) to keep the file
 * compact and easy to extend. A fourth "mega" level is built at runtime from
 * the medium + tricky pools.
 *
 * Difficulty guide (grade 6 and below):
 *   easy   -> short words (3-5 letters), very direct clues
 *   medium -> medium words (4-7 letters), slightly playful clues
 *   tricky -> longer words (6-12 letters), riddle-style clues
 */

var THEMES = {};

// Friendly difficulty levels used by the UI and the generator.
var DIFFICULTIES = [
  { id: "easy",   label: "Easy",   stars: "⭐",     words: 7,  mult: 1,   comboWindow: 32, golden: 2, desc: "Short words & simple clues" },
  { id: "medium", label: "Medium", stars: "⭐⭐",   words: 9,  mult: 1.3, comboWindow: 30, golden: 2, desc: "A little more thinking" },
  { id: "tricky", label: "Tricky", stars: "⭐⭐⭐", words: 10, mult: 1.6, comboWindow: 28, golden: 3, desc: "Longer words & riddles" },
  { id: "mega",   label: "Mega",   stars: "🔥",     words: 13, mult: 2.2, comboWindow: 26, golden: 4, desc: "Huge grid, huge rewards", unlockLevel: 3 },
];

function parseWordList(txt) {
  return String(txt || "")
    .split("\n")
    .map(function (l) { return l.trim(); })
    .filter(Boolean)
    .map(function (l) {
      var i = l.indexOf("|");
      return { a: l.slice(0, i).trim().toUpperCase(), c: l.slice(i + 1).trim() };
    })
    .filter(function (e) { return /^[A-Z]{3,13}$/.test(e.a) && e.c; });
}

function registerTheme(key, def) {
  THEMES[key] = {
    name: def.name,
    emoji: def.emoji,
    blurb: def.blurb,
    cheer: def.cheer,
    pal: def.pal,
    fx: def.fx,
    levels: {
      easy: parseWordList(def.easy),
      medium: parseWordList(def.medium),
      tricky: parseWordList(def.tricky),
    },
  };
}

registerTheme("regular", {
  name: "Everyday", emoji: "✏️", blurb: "Classic words from school and home.",
  cheer: "Brilliant work, word wizard!",
  pal: { bg1: "#eef4ff", bg2: "#d7e6ff", accent: "#3b82f6", accent2: "#2563eb", soft: "#dbeafe", word: "#d9e9ff", active: "#ffe39e", ink: "#243b53", inkSoft: "#486581" },
  fx: { e: ["✏️", "📚", "⭐", "🖍️"], mode: "drift" },
  easy: `
CAT|A pet that says meow
DOG|A pet that barks
SUN|It lights up the daytime sky
BALL|A round toy you bounce or kick
BOOK|You read this
TREE|It has a trunk, branches, and leaves
FISH|It swims and has fins
MILK|A white drink from cows
RAIN|Water that falls from clouds
STAR|It twinkles in the night sky
BIRD|An animal with feathers that can fly
CAKE|A sweet treat for birthdays
HAT|You wear it on your head
BED|You sleep in it at night
CUP|You drink from it
EGG|A hen lays this
BUS|A big yellow one takes kids to school
DOOR|You open it to walk into a room
LAMP|It gives light on your desk
SOCK|It goes on your foot before your shoe
CHAIR|You sit on it
CLOCK|It tells you the time
APPLE|A crunchy red or green fruit
BREAD|You make toast from it
HOUSE|A home where a family lives
SMILE|What your face does when you are happy
KITE|It flies high on a windy day
DUCK|It quacks and paddles in ponds
TOOTH|You brush it twice a day
SOAP|It makes bubbles when you wash your hands
`,
  medium: `
PENCIL|You write with this and can erase it
GARDEN|A place where flowers and veggies grow
WINDOW|Glass you look through in a wall
BASKET|You carry fruit or laundry in it
PLANET|Earth is one of these in space
BRIDGE|You cross this over a river
ORANGE|A round fruit and also a color
FRIEND|Someone you like to play with
ROCKET|It blasts off into space
TURTLE|A slow animal with a hard shell
PUZZLE|Pieces you fit together for fun
BUTTON|You press this or it holds a shirt closed
BLANKET|A warm cover for your bed
KITCHEN|The room where food is cooked
PILLOW|A soft cushion for your head at night
PICNIC|A meal outside on a blanket
BALLOON|Blow air in it and it gets big and round
CASTLE|A king and queen live here
MIRROR|You see yourself in it
TEACHER|The grown-up who helps you learn at school
HAMMER|A tool for banging in nails
JACKET|A coat for a cool, breezy day
CARROT|An orange veggie that bunnies love
HELMET|Wear it to keep your head safe on a bike
LADDER|Climb its steps to reach high places
ZIPPER|It closes your jacket with a zzzip
MAGNET|It sticks to the fridge and pulls on metal
CRAYON|A waxy stick for coloring pictures
SHOWER|Water sprays down on you to get clean
`,
  tricky: `
RAINBOW|Seven colors that appear after a storm
LIBRARY|A quiet place full of books to borrow
DIAMOND|A sparkly gem and a baseball field shape
VOLCANO|A mountain that can erupt with hot lava
PENGUIN|A bird in a tuxedo that cannot fly
COMPASS|It always points you toward north
GRAVITY|The force that pulls things down to Earth
TRIANGLE|A shape with three sides
TREASURE|Gold and jewels a pirate hides
WHISPER|To talk very, very quietly
JOURNEY|A long trip from one place to another
MYSTERY|A puzzle or secret to be solved
ADVENTURE|An exciting trip full of surprises
BIRTHDAY|The special day each year when you turn one year older
SANDWICH|Bread with yummy filling in the middle
UMBRELLA|Open it up to stay dry in the rain
BICYCLE|It has two wheels and pedals
KANGAROO|It hops and carries a baby in its pouch
CALENDAR|It shows the days, weeks, and months
ELEVATOR|A moving room that carries you between floors
HOMEWORK|School work you do at your house
NEIGHBOR|Someone who lives next door
ALPHABET|All the letters from A to Z
QUESTION|You ask this to find something out
SURPRISE|Something you did not expect
TELEPHONE|You use it to call someone far away
KEYBOARD|You type on its many keys
FIREWORKS|Bright booms and sparkles in the night sky
`,
});

registerTheme("halloween", {
  name: "Halloween", emoji: "🎃", blurb: "Spooky words for a frightfully fun puzzle!",
  cheer: "Spook-tacular solving! 🎃",
  pal: { dark: true, bg1: "#2a1736", bg2: "#160d22", accent: "#ff7a18", accent2: "#ff8f3a", soft: "#3a2350", card: "#2f1d3f", ink: "#ffe9d6", inkSoft: "#d8b6f0", cell: "#efe3ff", line: "#7a5aa0", word: "#cdb0ff", active: "#ffb347" },
  fx: { e: ["🦇", "👻", "🎃", "🕸️"], mode: "drift" },
  easy: `
BAT|A flying animal seen at night
OWL|A bird that hoots in the dark
BOO|What a ghost says to scare you
CAT|A black one is a Halloween symbol
WEB|A spider spins this sticky trap
BONE|A skeleton is made of these
MASK|You wear this to hide your face
MOON|It glows full and bright on spooky nights
CANDY|Sweet treats you collect on Halloween
DARK|The opposite of light
FANG|A pointy tooth a vampire has
TOMB|A stone room where the dead rest
RAT|A small rodent with a long tail
HOWL|The long, spooky sound a wolf makes
FOG|A thick, misty cloud near the ground
EEK|A squeaky little scream
HAT|A witch wears a pointy one
WAND|A stick used to cast spells
CAPE|A vampire's flowing cloak
TREAT|Trick or ___!
SCARY|It makes you jump with fright
NIGHT|When trick-or-treating happens, after dark
GOO|Slimy, sticky stuff
CROW|A black bird that caws
TOAD|A bumpy cousin of the frog, great for potions
`,
  medium: `
GHOST|A see-through spirit that goes boo
WITCH|She flies on a broom and casts spells
SPIDER|An eight-legged web spinner
GOBLIN|A small, mischievous monster
BROOM|A witch's flying ride
POTION|A magic drink in a bubbling pot
SPOOKY|Another word for creepy or scary
PUMPKIN|An orange gourd you carve into a face
COSTUME|The outfit you wear to dress up
SHADOW|A dark shape that follows you
CACKLE|A witch's spooky laugh
HAUNT|What a ghost does to a house
CREEPY|Strange in a way that gives you goosebumps
WIZARD|A man who does magic
SCREAM|A loud cry when you are scared
CANDLE|It flickers inside a carved pumpkin
HAUNTED|A house full of ghosts is this
TRICK|A sneaky joke instead of a treat
SPELL|Magic words a witch says
SKULL|The bony part of your head
COFFIN|A box a vampire sleeps in
CREAKY|How a spooky old door sounds
GHOUL|A creepy, ghostly creature
SLIME|Gooey green ooze
WARLOCK|A male witch or sorcerer
`,
  tricky: `
SKELETON|A spooky frame of bones with no skin
VAMPIRE|A creature with fangs who fears garlic
MONSTER|A scary creature that might hide under the bed
MUMMY|An ancient body wrapped in bandages
CAULDRON|The big black pot a witch stirs
GRAVEYARD|A field full of tombstones
MIDNIGHT|Twelve o'clock, the witching hour
LANTERN|A carved pumpkin with a glowing light, jack-o'-___
SHRIEK|A loud, scary scream
ZOMBIE|An undead creature that groans and shuffles
PHANTOM|A fancy word for a ghost
WEREWOLF|A person who turns furry under a full moon
SCARECROW|A straw figure that guards a farm field
HALLOWEEN|The spooky holiday on October 31st
TOMBSTONE|A stone marker in a graveyard
COBWEB|An old, dusty spider web
NIGHTMARE|A really bad, scary dream
SPELLBOOK|A witch keeps her magic recipes in this
JACKOLANTERN|A pumpkin carved with a glowing face
GOOSEBUMPS|Tiny bumps on your skin when you are scared or cold
BROOMSTICK|A witch's flying ride with bristles
TRICKORTREAT|What kids say at each door on Halloween
SPOOKTACULAR|Super spooky and super amazing
MOONLIGHT|Silvery light that shines on a spooky night
`,
});

registerTheme("valentines", {
  name: "Valentine's Day", emoji: "💝", blurb: "Sweet and lovely words full of heart.",
  cheer: "You filled it with love! 💖",
  pal: { bg1: "#ffe3ee", bg2: "#ffc7dd", accent: "#ff4d8d", accent2: "#e91e63", soft: "#ffd6e6", word: "#ffd0e2", active: "#ffe08a", ink: "#6b2143", inkSoft: "#a33b66" },
  fx: { e: ["💕", "💖", "🌹", "💌"], mode: "rise" },
  easy: `
LOVE|A warm feeling for someone special
HUG|You wrap your arms around someone for this
KISS|A little peck to show you care
ROSE|A red flower for Valentine's Day
PINK|A soft color, mix of red and white
CARD|You send this with a sweet message
CUTE|Adorable and sweet
GIFT|A present you give with love
DOVE|A white bird of peace and love
BEAR|A stuffed teddy ___ makes a sweet gift
DEAR|A loving way to start a letter
STAR|You're my shining ___
RED|The color of a big valentine heart
BOW|A pretty knot of ribbon
KIND|Being nice and caring
CARE|To look after someone
LACE|Pretty, holey trim on fancy cards
NOTE|A short message to someone special
JOY|A big happy feeling
PAL|A buddy or friend
GLAD|Happy and pleased
LILY|A pretty white flower
MINE|Be ___, valentine!
HONEY|Sweet stuff from bees, also a cute nickname
`,
  medium: `
HEART|The shape that means love
CUPID|The baby angel who shoots love arrows
ARROW|Cupid shoots this from his bow
FLOWER|A bloom you give to someone special
CANDY|Sweet treats in a heart-shaped box
FRIEND|Someone you share your heart with
SWEET|Like sugar, or a kind person
RIBBON|A pretty bow on a gift
LETTER|A note you mail to someone you love
PETALS|The soft colorful parts of a flower
CHERISH|To love and hold dear
ADMIRE|To really like and look up to someone
POEM|Rhyming words written for someone you love
CUDDLE|A cozy, snuggly hug
DARLING|A sweet name for someone you love
GENTLE|Soft and kind
LOCKET|A tiny heart-shaped necklace that opens
TEDDY|A cuddly bear toy
SPARKLE|To shine with tiny flashes of light
FAMILY|The people at home who love you most
CARING|Kind and thoughtful toward others
PUPPY|A baby dog full of wiggly love
VELVET|Soft, smooth fabric for a fancy gift box
GLITTER|Sparkly specks for decorating cards
`,
  tricky: `
CHOCOLATE|A sweet brown treat often given in a heart box
ROMANCE|A sweet, loving story or feeling
AFFECTION|A gentle feeling of fondness and love
SWEETHEART|A loving name for the one you adore
DEVOTION|Deep, loyal love for someone
CHARMING|Pleasant and delightful, like a storybook prince
BOUQUET|A bunch of flowers tied together
TENDER|Soft, gentle, and caring
PROMISE|A word you give that you will keep
CARNATION|A frilly flower often given on this day
FOREVER|For all time, with no end
DELIGHT|A feeling of great joy and happiness
VALENTINE|A card or a special someone on February 14th
FRIENDSHIP|What you share with your best buddy
KINDNESS|Being friendly, generous, and caring
TOGETHER|With each other, side by side
CUPCAKE|A tiny cake with frosting on top
HUGGABLE|So cuddly you want to squeeze it
ADORABLE|Super, super cute
GRATITUDE|A thankful feeling
COMPLIMENT|Nice words that make someone smile
SNUGGLE|To curl up close and cozy
MARSHMALLOW|A soft, fluffy, puffy sweet
LOVEBIRDS|Two little parrots, or two people in love
`,
});

registerTheme("christmas", {
  name: "Christmas", emoji: "🎄", blurb: "Jolly, snowy words for the holidays.",
  cheer: "Ho ho ho — puzzle unwrapped! 🎁",
  pal: { bg1: "#e7f6ec", bg2: "#cdeed6", accent: "#e53935", accent2: "#c62828", soft: "#ffd8d6", word: "#cfeddd", active: "#ffe39e", ink: "#14532d", inkSoft: "#2e7d4f" },
  fx: { e: ["❄️", "❅", "❆", "⛄"], mode: "fall" },
  easy: `
ELF|Santa's little helper
TOY|A gift a child loves to play with
STAR|It sits on top of the tree
BELL|It jingles and rings
SNOW|White flakes that fall in winter
GIFT|A wrapped present under the tree
TREE|You decorate this green plant for Christmas
SLED|You ride this down a snowy hill
SANTA|The jolly man in a red suit
RED|Santa's favorite color to wear
CANE|A candy ___ is striped and sweet
GOLD|A shiny color of tinsel and gifts
JOY|A happy holiday feeling
FIR|A kind of evergreen Christmas tree
ICE|Frozen water you can skate on
BOX|A gift comes wrapped in this
POLE|Santa lives at the North ___
NOEL|Another word for Christmas in carols
WRAP|To cover a present with paper
COCOA|A warm chocolate drink
SCARF|A long, warm wrap for your neck
ANGEL|A winged figure on top of some trees
MERRY|___ Christmas!
LIGHT|Twinkly ones are strung on the tree
`,
  medium: `
REINDEER|Animals that pull Santa's sleigh
SLEIGH|Santa's flying ride
WREATH|A round decoration for the front door
CANDLE|A small flame that glows on cold nights
WINTER|The cold, snowy season
JINGLE|The sound of ringing bells
RIBBON|It ties up a pretty present
COOKIE|A treat left out for Santa
MITTEN|It keeps your hand warm in the snow
STOCKING|A sock hung by the fireplace for gifts
HOLLY|A plant with red berries and green leaves
PRESENT|A gift under the tree
SNOWMAN|A frosty figure with a carrot nose
CHEER|Holiday happiness and good spirits
NORTH|Santa's home is at the ___ Pole
EGGNOG|A creamy holiday drink
SWEATER|A cozy knit top, sometimes silly on purpose
GARLAND|A long rope of greenery or tinsel
FESTIVE|Full of party and holiday spirit
ICICLE|A pointy stick of ice hanging from a roof
SKATES|Boots with blades for gliding on ice
JOLLY|Happy and full of laughs, like Santa
`,
  tricky: `
SNOWFLAKE|No two of these icy crystals are alike
ORNAMENT|A shiny ball that hangs on the tree
CHIMNEY|Santa slides down this to enter your home
GINGERBREAD|A spicy cookie shaped like a little man
MISTLETOE|A plant you might get a kiss under
NUTCRACKER|A toy soldier that cracks open nuts
BLIZZARD|A heavy snowstorm with strong wind
CAROL|A happy Christmas song
TINSEL|Shiny strands draped on the tree
POINSETTIA|A famous red Christmas flower
NAUGHTY|The opposite of nice on Santa's list
WORKSHOP|Where the elves build toys
PEPPERMINT|A minty flavor of candy canes
SNOWBALL|A round lump of snow you toss
FIREPLACE|Stockings hang above it
DECEMBER|The month Christmas is in
CELEBRATE|To have a happy party for a special day
TOBOGGAN|A long sled for zooming down hills
CANDYCANE|A striped, hook-shaped sweet
SNOWGLOBE|Shake it to make a tiny blizzard
HOLIDAY|A special day off to celebrate
WRAPPING|___ paper covers a present
NORTHPOLE|Santa's snowy home at the top of the world
`,
});

registerTheme("space", {
  name: "Outer Space", emoji: "🚀", blurb: "Blast off with words from the galaxy!",
  cheer: "Out of this world! 🚀",
  pal: { dark: true, bg1: "#0f1b3d", bg2: "#060a1f", accent: "#7c5cff", accent2: "#a08bff", soft: "#241a4d", card: "#15224a", ink: "#e6ecff", inkSoft: "#a9b6e6", cell: "#e9edff", line: "#4a5896", word: "#c2b6ff", active: "#ffd766" },
  fx: { e: ["✦", "✧", "⭐", "🪐"], mode: "twinkle" },
  easy: `
SUN|The star at the center of our solar system
MOON|It orbits Earth and glows at night
STAR|A glowing ball of gas in the sky
MARS|The red planet
ALIEN|A creature from another planet
ORBIT|The path a planet travels around the sun
COMET|A space snowball with a glowing tail
EARTH|The planet we all live on
ROCK|Space ones that streak through the sky are meteors
DARK|How space looks with no light
GLOW|What stars do in the night sky
RAYS|Beams of light from the sun
SKY|Look up to see the stars in it
UFO|A flying saucer, maybe
RING|Saturn has big ones around it
DUST|Tiny bits floating between stars
NOVA|A star that suddenly gets super bright
HOT|The sun is very, very ___
FLY|What rockets do, up and away
BEAM|A ray of light
SPACE|Where the planets and stars are
LIGHT|It zooms from the stars faster than anything
ROVER|A robot car that drives on Mars
SUIT|An astronaut wears a space ___
`,
  medium: `
PLANET|Jupiter and Saturn are both this
ROCKET|A ship that launches into space
GALAXY|A huge group of millions of stars
SATURN|The planet famous for its rings
METEOR|A shooting star streaking across the sky
JUPITER|The biggest planet in our solar system
GRAVITY|The force that keeps planets in orbit
ECLIPSE|When the moon blocks out the sun
CRATER|A bowl-shaped dent on the moon
NEPTUNE|The farthest planet, deep blue in color
VENUS|The hottest planet, second from the sun
COMET|It zooms by with an icy, glowing tail
URANUS|A planet that spins on its side
PLUTO|A dwarf planet far from the sun
CAPSULE|Astronauts ride inside this small spacecraft
COSMOS|Another word for the whole universe
LUNAR|Having to do with the moon
SUNSPOT|A dark patch on the sun
HELMET|An astronaut's see-through head cover
STATION|A space ___ is where astronauts live in orbit
ZERO|___ gravity makes you float
`,
  tricky: `
ASTRONAUT|A person trained to travel in space
TELESCOPE|A tool that makes far-away stars look close
SATELLITE|A machine that orbits Earth, like a tiny moon
UNIVERSE|Everything that exists, all of space
ASTEROID|A small rocky body orbiting the sun
NEBULA|A colorful cloud of gas and dust in space
SPACESHIP|A vehicle that carries crew through the stars
GALILEO|Famous scientist who studied the stars with a telescope
MERCURY|The smallest planet, closest to the sun
LAUNCH|The moment a rocket lifts off
STARGAZE|To look up and admire the night sky
SOLAR|Having to do with the sun, like a ___ system
COUNTDOWN|Ten, nine, eight... before liftoff
BLASTOFF|The moment a rocket roars upward
SPACESUIT|Special clothes that keep astronauts safe in space
BLACKHOLE|A place in space where gravity pulls in even light
MOONWALK|A stroll on the lunar surface
SHOOTINGSTAR|A streak of light across the night sky
OBSERVATORY|A building with a giant telescope for watching the sky
SOLARSYSTEM|The sun and all the planets that circle it
MILKYWAY|Our home galaxy
WEIGHTLESS|How you feel floating in space
PLANETARIUM|A dome theater that shows the night sky
ASTRONOMY|The science of stars and planets
`,
});

registerTheme("ocean", {
  name: "Under the Sea", emoji: "🐠", blurb: "Dive into a sea of watery words.",
  cheer: "Fin-tastic job! 🐠",
  pal: { bg1: "#d6f3ff", bg2: "#a8e4f7", accent: "#0ea5b7", accent2: "#0891a8", soft: "#c2eef6", word: "#bdeaf5", active: "#ffe08a", ink: "#08415c", inkSoft: "#1d6f8b" },
  fx: { e: ["🫧", "○", "🐟", "🫧"], mode: "rise" },
  easy: `
FISH|It swims with fins and gills
CRAB|It walks sideways and has claws
WAVE|Water that rolls onto the beach
SAND|Tiny grains on the beach
SEAL|A sea animal that claps and barks
SHELL|A hard home a snail or clam carries
REEF|A colorful coral home for fish
SWIM|To move through the water
BOAT|It floats on top of the water
DEEP|Very far down in the ocean
SALT|It makes ocean water taste this way
TIDE|The rise and fall of the sea
EEL|A long, slippery, snakelike fish
CLAM|A shellfish that opens and closes
SEA|A big body of salty water
FIN|A fish uses it to steer
SQUID|It has ten arms and squirts ink
SHIP|A very big boat
WET|How you feel after a swim
OAR|A paddle for rowing a boat
GULL|A seabird that squawks at the beach
SURF|Ride a wave on a board
BEACH|Sandy shore by the sea
KELP|A tall seaweed that forms underwater forests
OTTER|It floats on its back and cracks shells
PIER|A wooden walkway out over the water
`,
  medium: `
SHARK|A big fish with rows of sharp teeth
WHALE|The largest animal in the ocean
CORAL|Colorful rock-like reef made by tiny animals
OCTOPUS|A sea creature with eight arms
DOLPHIN|A smart, playful animal that leaps from waves
LOBSTER|A sea animal with big claws that turns red when cooked
ISLAND|Land with water all around it
ANCHOR|It drops down to keep a boat in place
SEAWEED|Green plants that float in the sea
STARFISH|A sea creature shaped like a star
PEARL|A shiny ball that forms inside an oyster
CURRENT|A flow of moving water in the sea
SPLASH|What water does when you jump in
SAILOR|A person who works on a ship
WALRUS|A big sea mammal with long tusks
OYSTER|A shellfish that can make a pearl
MANATEE|A gentle, slow sea cow
HARBOR|A safe place where boats dock
SCUBA|Gear that lets divers breathe underwater
NARWHAL|A whale with a long spiral tusk
SHRIMP|A tiny curled-up sea creature
LAGOON|A calm pool of seawater near the coast
DIVER|A person who swims deep underwater
`,
  tricky: `
JELLYFISH|A see-through sea creature that can sting
SUBMARINE|A ship that travels underwater
SEAHORSE|A tiny fish shaped like a horse's head
TREASURE|Sunken gold a diver might find
STINGRAY|A flat fish that glides like it's flying
BARNACLE|A little shell creature stuck to rocks and boats
PLANKTON|Tiny drifting food that whales love to eat
LIGHTHOUSE|A tall tower that warns ships with its light
TENTACLE|A long bendy arm of an octopus or squid
MERMAID|A make-believe creature, half girl and half fish
SEASHELL|Hold it to your ear to hear a whoosh like the sea
SNORKEL|A tube that lets you breathe while face-down in water
ATLANTIC|The ocean between America and Europe
PACIFIC|The biggest ocean on Earth
SHIPWRECK|A sunken old boat on the sea floor
HAMMERHEAD|A shark with a T-shaped head
SANDCASTLE|A fort you build at the beach
SWORDFISH|A fish with a long, pointy bill
CLOWNFISH|An orange and white striped fish that hides in anemones
ANEMONE|A wavy sea creature that looks like a flower
UNDERWATER|Below the surface of the sea
WHIRLPOOL|Water spinning around in a swirl
`,
});

registerTheme("jungle", {
  name: "Jungle Safari", emoji: "🦁", blurb: "Wild words from the rainforest and savanna.",
  cheer: "Wildly well done! 🦁",
  pal: { bg1: "#e6f6d9", bg2: "#c5ec9f", accent: "#4caf2f", accent2: "#2e7d12", soft: "#d6f3c4", word: "#d2efbb", active: "#ffe08a", ink: "#234d0e", inkSoft: "#3f7a1f" },
  fx: { e: ["🍃", "🌿", "🦋", "🍂"], mode: "fall" },
  easy: `
LION|The king of the jungle
APE|A big animal like a gorilla, with no tail
FROG|A green hopper that says ribbit
VINE|A long plant you could swing on
BIRD|A colorful one might be a parrot
ZEBRA|A striped animal like a wild horse
BUG|A tiny crawly insect
TREE|Monkeys love to climb these
ROAR|The loud sound a lion makes
TAIL|A monkey can hang by this
MUD|Wet dirt a pig loves to roll in
LEAF|A flat green part of a plant
ANT|A tiny insect that lives in a colony
BAT|A furry flyer that sleeps upside down
NUT|A hard seed that monkeys crack open
HIPPO|A huge animal that loves the river
RHINO|It has a horn on its nose
SLOTH|A super slow animal that hangs in trees
PALM|A tropical tree with big leaves
NEST|A bird's home made of twigs
GECKO|A little lizard with sticky feet
CUB|A baby lion
TUSK|An elephant's long tooth
MANGO|A sweet tropical fruit
HYENA|A spotted animal with a giggly laugh
`,
  medium: `
TIGER|A big orange cat with black stripes
MONKEY|A playful animal that swings through trees
PARROT|A colorful bird that can copy your words
JAGUAR|A spotted big cat of the rainforest
SNAKE|A long animal with no legs that slithers
TOUCAN|A bird with a huge colorful beak
JUNGLE|A thick, wild forest full of animals
GORILLA|The largest ape, strong and gentle
LEOPARD|A spotted cat that rests in trees
PANTHER|A sleek black big cat
INSECT|A small animal with six legs
CHEETAH|The fastest land animal
GIRAFFE|The tallest animal, with a very long neck
PYTHON|A big snake that squeezes
LIZARD|A scaly reptile with four legs and a tail
SAFARI|A trip to see wild animals
LEMUR|A ring-tailed animal from Madagascar
VULTURE|A bird that circles over the savanna
BAMBOO|A tall plant that pandas munch
OSTRICH|The biggest bird; it can't fly but runs fast
MEERKAT|A little animal that stands up to keep watch
GAZELLE|A fast, graceful antelope
BABOON|A big monkey that lives in troops on the ground
CANOPY|The leafy top layer of the rainforest
`,
  tricky: `
ELEPHANT|A huge gray animal with a long trunk
CROCODILE|A scaly reptile with a snappy, toothy grin
BUTTERFLY|A bug with big colorful wings
RAINFOREST|A warm, wet forest where it rains a lot
CHIMPANZEE|A clever ape that is one of our closest relatives
RHINOCEROS|A big animal with a horn on its nose
HIPPOPOTAMUS|A huge animal that loves wallowing in the river
ORANGUTAN|A red-haired ape that lives in the trees
PREDATOR|An animal that hunts other animals for food
EXPLORER|A person who travels to discover new places
CAMOUFLAGE|Colors that help an animal blend in and hide
STAMPEDE|A wild herd running all at once
ANACONDA|A giant snake of the Amazon
FLAMINGO|A pink bird that stands on one leg
CHAMELEON|A lizard that can change its colors
WATERFALL|A river pouring over a cliff
ANTEATER|An animal with a long snout that slurps up ants
PORCUPINE|An animal covered in sharp quills
TARANTULA|A big, hairy spider
WILDEBEEST|A shaggy antelope that travels in huge herds
BINOCULARS|You look through these to see far-off animals
SAVANNA|Grassy plains where lions roam
TREETOPS|Where monkeys swing, high up
`,
});
