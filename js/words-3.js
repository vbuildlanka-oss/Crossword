/* Word banks — part 3 (fairy tales, science, vehicles, body, world, pirates). */

registerTheme("magic", {
  name: "Fairy Tale Magic", emoji: "🧚", blurb: "Castles, dragons, and enchanted words!",
  cheer: "Magically marvelous! ✨",
  pal: { bg1: "#f5e9ff", bg2: "#e2c9ff", accent: "#a855f7", accent2: "#7e22ce", soft: "#f3e8ff", word: "#e9d5ff", active: "#ffe08a", ink: "#3b0764", inkSoft: "#6b21a8" },
  fx: { e: ["✨", "🪄", "⭐", "💫"], mode: "twinkle" },
  easy: `
WAND|A fairy's magic stick
KING|He wears a crown and rules the land
QUEEN|She wears a crown and rules the land
ELF|A pointy-eared magical helper
OGRE|A big, grumpy giant in stories
GEM|A sparkly jewel
GOLD|Shiny treasure in a pot at the rainbow's end
ORB|A glowing magic ball
CROWN|A royal hat with jewels
FAIRY|A tiny winged magical being
TOWER|A tall, skinny part of a castle
MAGIC|Spells and wonder
SPELL|Magic words
FROG|In one tale, a kiss turns it into a prince
WISH|You make one on a falling star
TROLL|A creature that lives under a bridge in stories
GNOME|A tiny bearded fellow in the garden
GIANT|A huge person at the top of a beanstalk
PIXIE|A tiny, playful fairy
SWORD|A knight's long blade
OWL|A wise bird in many tales
MOAT|Water all around a castle
QUEST|A big heroic journey
HERO|The brave one who saves the day
`,
  medium: `
CASTLE|A royal stone home with towers
DRAGON|A huge beast that breathes fire
WIZARD|A wise old magic-maker with a pointy hat
PRINCE|A king's son
KNIGHT|A brave warrior in shining armor
UNICORN|A magic horse with one horn
POTION|A magic drink in a little bottle
GOBLIN|A small, sneaky creature
THRONE|A king's fancy chair
DUNGEON|A dark room under a castle
FOREST|A woods full of trees
GENIE|It pops out of a lamp to grant wishes
PALACE|A royal home
SHIELD|A knight blocks with this
COTTAGE|A small, cozy house in the woods
JESTER|A funny clown in the king's court
PHOENIX|A magic bird that rises from flames
GRIFFIN|Half eagle, half lion
CHARM|A magic spell or a lucky trinket
LEGEND|An old story passed down for ages
RIDDLE|A tricky question to puzzle out
MERMAID|A sea maiden with a fishy tail
`,
  tricky: `
PRINCESS|A king's daughter
ENCHANTED|Under a magic spell
BEANSTALK|A giant plant that grows up to the clouds
DRAWBRIDGE|A castle bridge that lifts up
FAIRYTALE|A magical story that starts with once upon a time
SORCERER|A powerful wizard
KINGDOM|A land ruled by a king or queen
HAPPILY|___ ever after
LEPRECHAUN|A tiny Irish fellow with a pot of gold
MAGICIAN|A person who does tricks and magic
CRYSTALBALL|A glassy orb for seeing the future
INVISIBLE|Impossible to see
STORYBOOK|A book full of tales
GOLDILOCKS|A girl who tried the three bears' porridge
RAPUNZEL|A girl with super long hair in a tower
HOURGLASS|Sand trickles through it to tell time
CAULDRON|A bubbling pot for brewing potions
`,
});

registerTheme("science", {
  name: "Science Lab", emoji: "🔬", blurb: "Experiment with brainy words!",
  cheer: "Scientifically superb! 🧪",
  pal: { bg1: "#e6fffb", bg2: "#b2f5ea", accent: "#0d9488", accent2: "#0f766e", soft: "#ccfbf1", word: "#b8f0e6", active: "#ffe08a", ink: "#134e4a", inkSoft: "#115e59" },
  fx: { e: ["⚛️", "🧪", "🫧", "🔭"], mode: "rise" },
  easy: `
LAB|A room where scientists do experiments
ATOM|A super tiny building block of everything
GAS|Air is one of these
HEAT|What makes ice melt
TEST|Try something out to see what happens
GERM|A tiny bug that can make you sick
CELL|The tiny unit living things are made of
WAVE|Sound travels as one
IDEA|A thought that pops into your mind
SOLID|Ice is the ___ form of water
FACT|Something that is true
LENS|Curved glass in glasses and cameras
DATA|Facts and numbers you collect
PUSH|A force that moves something away
PULL|A force that moves something closer
MOLD|Fuzzy green stuff on old bread
ROBOT|A machine that can do jobs on its own
METAL|Iron and gold are kinds of this
WATER|It's called H2O
SPARK|A tiny flash of electricity
FIZZ|Bubbles that pop in soda
MELT|Turn from solid to liquid
GEAR|A wheel with teeth in a machine
`,
  medium: `
OXYGEN|The gas we breathe in
GOGGLES|Safety glasses for experiments
BEAKER|A glass cup for measuring liquids
LIQUID|Water and juice are this
ENERGY|The power to make things move or work
MATTER|Anything that takes up space
MINERAL|A natural solid like quartz
CIRCUIT|A loop that electricity travels through
BATTERY|It stores power for a flashlight
LASER|A super-focused beam of light
THEORY|A big idea that explains something
INVENT|To create something brand new
MOTION|Movement
CRYSTAL|A sparkly solid with a repeating pattern
GENIUS|A super smart person
VAPOR|Water as a gas
ELEMENT|Gold, iron, and oxygen are each one
BUBBLE|A ball of air trapped in liquid
PRISM|A glass shape that splits light into a rainbow
MAGNET|It pulls on iron and has two poles
`,
  tricky: `
EXPERIMENT|A test to find out how something works
SCIENTIST|A person who studies how the world works
MICROSCOPE|A tool that makes tiny things look big
ELECTRICITY|Power that flows through wires
HYPOTHESIS|A smart guess you can test
LABORATORY|A science workroom
INVENTION|Something new that someone made
MOLECULE|Atoms joined together
FRICTION|The rubbing force that slows things down
CHEMISTRY|The science of what stuff is made of
ECOSYSTEM|Living things and their home, working together
MAGNIFY|To make something look bigger
RECYCLE|To turn old things into new things
POLLINATE|What bees do when they carry pollen between flowers
OBSERVE|To watch carefully
DISCOVERY|Finding something new
BACTERIA|Tiny living things, some helpful and some harmful
`,
});

registerTheme("vehicles", {
  name: "Things That Go", emoji: "🚗", blurb: "Zoom, choo-choo, and vroom!",
  cheer: "Full speed ahead, champ! 🏎️",
  pal: { bg1: "#f1f5f9", bg2: "#cbd5e1", accent: "#ef4444", accent2: "#b91c1c", soft: "#fee2e2", word: "#dbe4ee", active: "#ffe08a", ink: "#1e293b", inkSoft: "#475569" },
  fx: { e: ["🚗", "🚀", "✈️", "🚂"], mode: "drift" },
  easy: `
CAR|You ride in it on the road
VAN|A boxy car for big families
JET|A super fast airplane
CAB|Another word for a taxi
BUS|A long vehicle that carries lots of riders
SHIP|A very big boat
BOAT|It floats and carries you across water
TRAIN|Choo choo! It rides on tracks
TRUCK|A big vehicle that carries heavy loads
TAXI|You pay a driver to take you somewhere
RAFT|A flat floating boat
KART|A small racing car for fun tracks
ROAD|Cars drive on it
WHEEL|A round part that turns
HORN|Beep beep! Press it to warn others
TIRE|A rubber ring around a wheel
TRAM|A streetcar on rails
MOPED|A small motor scooter
YACHT|A fancy boat for sailing or cruising
CANOE|A narrow boat you paddle
PLANE|It flies with wings and engines
SLED|It slides on snow
BRAKE|Press it to stop
SIREN|A loud wail from a fire truck
FERRY|A boat that carries people and cars across water
`,
  medium: `
ROCKET|It blasts off into space
SCOOTER|Kick and ride it with a handle
TRACTOR|A strong machine that works on farms
SUBWAY|A train that runs underground
ENGINE|The part that makes a vehicle go
WAGON|A little cart you pull
GLIDER|A plane with no engine that soars on the wind
PILOT|The person who flies a plane
DRIVER|The person steering the car
TRAFFIC|Lots of cars on the road
CABOOSE|The last car on an old-time train
RAILWAY|Tracks for trains
CHARIOT|A horse-drawn cart from ancient times
BLIMP|A big floating airship
TUGBOAT|A small strong boat that pushes big ships
GARAGE|Where you park your car at home
RACECAR|A super fast car on a track
`,
  tricky: `
AIRPLANE|It flies passengers across the sky
HELICOPTER|It flies with spinning blades on top
AMBULANCE|It rushes sick people to the hospital
FIRETRUCK|A red truck with ladders and hoses
BULLDOZER|A machine that pushes dirt
EXCAVATOR|A digger with a big scoop arm
MOTORCYCLE|A two-wheeler with an engine
SAILBOAT|A boat pushed by the wind
SEATBELT|Buckle it to stay safe in a car
LOCOMOTIVE|The engine that pulls a train
HOVERCRAFT|A craft that floats on a cushion of air
CONVERTIBLE|A car whose roof folds down
GARBAGETRUCK|It picks up the trash every week
MONORAIL|A train that runs on one rail
SNOWMOBILE|A sled with a motor
TRICYCLE|A bike with three wheels
POLICECAR|It has flashing lights and a siren for officers
UNICYCLE|A bike with just one wheel
LIMOUSINE|A long, fancy car
`,
});

registerTheme("body", {
  name: "Amazing Body", emoji: "💪", blurb: "Head, shoulders, knees, and words!",
  cheer: "Brain power at max! 🧠",
  pal: { bg1: "#fdf2e9", bg2: "#fad7c0", accent: "#0891b2", accent2: "#0e7490", soft: "#cffafe", word: "#fde0cc", active: "#fff08a", ink: "#3b2414", inkSoft: "#6b4430" },
  fx: { e: ["💪", "🧠", "❤️", "👣"], mode: "drift" },
  easy: `
EYE|You see with it
EAR|You listen with it
ARM|It bends at the elbow
LEG|You walk on two of these
TOE|You have ten on your feet
LIP|Part of your mouth
NOSE|You smell with it
HAND|It has five fingers
FOOT|It goes in a shoe
KNEE|The joint in the middle of your leg
HAIR|It grows on your head
SKIN|It covers your whole body
CHIN|It's just below your mouth
NECK|It holds up your head
BACK|The side of you opposite your belly
HEART|It pumps blood all day
TEETH|You chew with these
BRAIN|You think with it
THUMB|Your shortest, thickest finger
WRIST|It joins your hand to your arm
SPINE|The line of bones down your back
BELLY|Your tummy
JAW|It moves up and down when you chew
HIP|Where your leg joins your body
CHEEK|The soft side of your face
NAIL|Hard cover on the tip of a finger
YAWN|You do it when you're sleepy
`,
  medium: `
ELBOW|The bend in your arm
ANKLE|It joins your foot to your leg
FINGER|You have ten on your hands
STOMACH|Food goes here after you swallow
MUSCLE|It helps you move and lift
TONGUE|It helps you taste
LUNGS|They fill with air when you breathe
BLOOD|Red liquid pumped by the heart
EYEBROW|A strip of hair above your eye
HEALTHY|Strong and well
KIDNEY|A bean-shaped organ that cleans your blood
SNEEZE|Achoo!
BREATH|Air you take in and let out
EYELASH|A tiny hair on your eyelid
PULSE|The beat you can feel in your wrist
DOCTOR|A person who helps you get well
HICCUP|A funny jumpy sound you can't stop
SWEAT|Salty drops when you're hot
NOSTRIL|One of the two holes in your nose
KNUCKLE|A bumpy finger joint
`,
  tricky: `
SHOULDER|Where your arm joins your body
SKELETON|All the bones in your body
FOREHEAD|The part of your face above your eyes
STETHOSCOPE|A doctor listens to your heart with it
HEARTBEAT|Thump-thump, thump-thump
BELLYBUTTON|The little dent in the middle of your tummy
FINGERNAIL|The hard tip on each finger
EXERCISE|Moving your body to stay fit
VITAMINS|Good stuff in food that keeps you healthy
DIGESTION|How your body breaks down food
NUTRITION|Eating healthy foods
EYEBALL|The round part you see with
FRECKLES|Little brown dots on skin
FINGERPRINT|The swirly pattern on your fingertip
TOOTHBRUSH|You use it to clean your teeth
DENTIST|A doctor for your teeth
BACKBONE|Another name for your spine
COLLARBONE|A bone between your neck and shoulder
RIBCAGE|Bones that protect your heart and lungs
`,
});

registerTheme("world", {
  name: "Around the World", emoji: "🌍", blurb: "Travel the globe one word at a time!",
  cheer: "World-class solving! 🌏",
  pal: { bg1: "#e8f4f8", bg2: "#bfe3ee", accent: "#ca8a04", accent2: "#a16207", soft: "#fef9c3", word: "#d6ecf3", active: "#ffe08a", ink: "#0b3954", inkSoft: "#2f6b8a" },
  fx: { e: ["🌍", "✈️", "🗺️", "🧭"], mode: "drift" },
  easy: `
MAP|It shows you where places are
HILL|A small mountain
LAKE|A body of water with land all around
CITY|A big busy place with tall buildings
TOWN|A place smaller than a city
NILE|A super long river in Africa
PERU|A South American country with Machu Picchu
ASIA|The biggest continent
CUBA|An island country in the Caribbean
CHINA|The country with the Great Wall
INDIA|A country famous for the Taj Mahal
JAPAN|An island country, home of Mount Fuji
ITALY|A country shaped like a boot
EGYPT|The land of the pyramids
WORLD|The whole Earth
RIVER|Water that flows to the sea
GLOBE|A ball-shaped map of Earth
SOUTH|The opposite of north
EAST|Where the sun rises
WEST|Where the sun sets
OCEAN|A huge body of salt water
TRIP|A journey
FLAG|Each country has its own colorful one
NEPAL|A mountain country, home of Mount Everest
KENYA|An African country famous for safaris
DUNE|A hill of sand in the desert
`,
  medium: `
DESERT|A dry, sandy place
FRANCE|The Eiffel Tower is here
CANADA|A huge country north of the USA
MEXICO|A country south of the USA, famous for tacos
BRAZIL|A big South American country with the Amazon
GREECE|An ancient country with many islands
SPAIN|A country famous for flamenco dancing
VALLEY|Low land between hills
CANYON|A deep valley carved by a river
COUNTRY|A nation with its own flag
CAPITAL|The main city of a country
EUROPE|The continent with France and Germany
AFRICA|The continent with Egypt and Kenya
ARCTIC|The icy area at the top of the world
EQUATOR|An imaginary line around Earth's middle
PYRAMID|An ancient tomb with four triangle sides
TRAVEL|To go on a trip
TOURIST|A person visiting a new place
GLACIER|A giant, slow-moving river of ice
NORWAY|A Nordic country with fjords
GERMANY|A European country famous for castles and pretzels
AMAZON|The giant river and rainforest in South America
SAHARA|The biggest hot desert in the world
EVEREST|The tallest mountain in the world
`,
  tricky: `
CONTINENT|One of Earth's seven giant land areas
PASSPORT|A booklet you need to travel to other countries
LANGUAGE|English, Spanish, and Chinese are each one
AUSTRALIA|A country that is also a continent, home of kangaroos
ANTARCTICA|The frozen continent at the South Pole
SRILANKA|A teardrop-shaped island country famous for tea
SUITCASE|A bag you pack for a trip
SOUVENIR|A gift you bring home from a trip
LANDMARK|A famous place, like a big tower
HEMISPHERE|Half of the globe
MOUNTAIN|A very tall hill
LATITUDE|Map lines that run east to west
LONGITUDE|Map lines that run north to south
GEOGRAPHY|Learning about Earth's places
COLOSSEUM|An ancient arena in Rome
GREATWALL|A super long wall built across China
TAJMAHAL|A white marble wonder in India
`,
});

registerTheme("pirates", {
  name: "Pirate Seas", emoji: "🏴‍☠️", blurb: "Ahoy! Hunt for treasure words, matey!",
  cheer: "Shiver me timbers, ye found the loot! 🏴‍☠️",
  pal: { dark: true, bg1: "#0b2a3c", bg2: "#061722", accent: "#f5b700", accent2: "#ffc933", soft: "#173f55", card: "#12354a", ink: "#fff6dc", inkSoft: "#b8d4e0", cell: "#fff4d6", line: "#5d7f91", word: "#efd9a0", active: "#ffc861" },
  fx: { e: ["🌊", "⚓", "🪙", "🦜"], mode: "drift" },
  easy: `
SHIP|A big boat with sails
MAP|An X on this marks the treasure
GOLD|Shiny yellow treasure
SAIL|Cloth that catches the wind on a ship
MAST|The tall pole that holds the sails
DECK|The floor of a ship
HOOK|A curved pirate hand
AHOY|A pirate's hello
MATEY|A pirate's friend
COIN|A round piece of gold money
FLAG|A pirate ship flies a skull-and-bones one
CREW|All the sailors on a ship
CHEST|A box to hold treasure
PEG|A wooden leg
PATCH|A cover for one eye
SWORD|A long, sharp blade
CAVE|A secret hideout by the sea
PLANK|Walk the ___!
ISLE|A small island
KNOT|A tied rope, and also a ship's speed
ROPE|Sailors tie and pull this
LOOT|Stolen treasure
ARR|A pirate's growl
OAR|A paddle for rowing
SEA|Where pirates sail
JEWEL|A sparkly precious stone
`,
  medium: `
PIRATE|A sea robber who hunts treasure
PARROT|A talking bird on a pirate's shoulder
CANNON|A big gun on a ship that goes boom
ANCHOR|Drop it to keep the ship in place
CAPTAIN|The boss of the ship
COMPASS|It helps sailors find north
GALLEON|A big old sailing ship
CUTLASS|A pirate's short curved sword
BARREL|A wooden tub for storing supplies
ISLAND|Land with water all around it
VOYAGE|A long trip by sea
CABIN|A room on a ship
SKULL|It's on the pirate flag with crossbones
MUTINY|When the crew turns against the captain
BANDANA|A cloth tied around a pirate's head
LAGOON|A calm pool of seawater by an island
`,
  tricky: `
TREASURE|Gold and jewels hidden by pirates
SPYGLASS|A small telescope a pirate peeks through
DOUBLOON|An old Spanish gold coin
BUCCANEER|Another word for a pirate
SHIPWRECK|A ship sunk on the rocks
CROWSNEST|A lookout basket high on the mast
JOLLYROGER|The skull and crossbones flag
GANGPLANK|A board for walking onto a ship
PORTHOLE|A round window on a ship
SEAFARER|A person who travels by sea
LANDLUBBER|A pirate's name for someone who's never been to sea
CASTAWAY|Someone stranded on an island
STARBOARD|The right side of a ship
HIDEOUT|A secret place where pirates hide
TREASUREMAP|Follow it to find the X
`,
});

// The Surprise Mix pulls from every theme above (built at runtime).
var MIX_THEME = {
  key: "mix", name: "Surprise Mix", emoji: "🎲", blurb: "Words from every theme, all shuffled up!",
  cheer: "A true master of everything! 🎲",
  pal: { bg1: "#fdf4ff", bg2: "#e0e7ff", accent: "#8b5cf6", accent2: "#6d28d9", soft: "#ede9fe", word: "#ddd6fe", active: "#ffe08a", ink: "#2e1065", inkSoft: "#5b21b6" },
  fx: { e: ["🎲", "⭐", "🧩", "🎈"], mode: "drift" },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { THEMES, DIFFICULTIES, MIX_THEME };
}
