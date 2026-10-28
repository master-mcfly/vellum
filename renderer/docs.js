(function (root) {
  const { paragraphsFromBody } = root.VellumGround;

  const seeds = [
    {
      id: "river",
      title: "The Night the River Froze",
      author: "Lena Voss",
      kicker: "Essay",
      prompts: [
        "How long did the Silt stay frozen?",
        "Who stayed aboard the Marigold?",
        "How thick was the ice at the bend?",
      ],
      body: `Marrow Bend still measures winters against 1978. The Silt, usually a brown working river, locked solid on the night of January 11 and did not let go for seventeen days. People dated letters from the freeze the way other towns date them from a fire.

On the third morning Otto Hale, who baked on Front Street, walked a tray of rolls from his door to the far bank. He later said the ice rang under his boots like a church floor. Children followed his track until the constable, Ruth Abebe, set a rope line and allowed only single file. School stayed closed for nine of the seventeen days, not for cold but because the road over the low bridge had heaved.

The ferry Marigold was caught mid-channel, her wheelhouse turned a little toward town as if she had meant to finish the crossing. Captain Ida Pell refused a ladder. She had coal enough for the stove, she told Abebe through a megaphone, and a ferry left empty in ice had a way of being stripped by morning. Pell stayed aboard the whole seventeen days. Her daughter brought tins across the rope line every other noon.

At the bend, where the current slows against the willows, a county crew bored the ice and called it eleven inches. Near the mill race, where the water still shouldered along, it was only four. That difference kept the older men from driving a truck out, though two of them argued for it in the diner until Hale refused them coffee.

Rain arrived before dawn on January 28. At 4:10 a.m. the Marigold’s horn — one long note, then two short — carried up the bluff. By breakfast the ferry had swung free and Pell brought her in crooked, paint scarred, nobody hurt. The town’s count that census was 2,140. For a week afterward Hale sold the same rolls under a new name: river bread. He never wrote the recipe down.`,
    },
    {
      id: "bees",
      title: "Field Notes from a Roof Garden",
      author: "Amir Shah",
      kicker: "Field notes",
      prompts: [
        "When did the first bee arrive?",
        "What was the peak count, and when?",
        "Why did the tomato fail?",
      ],
      body: `These notes cover the fourteenth floor of Kestrel Court, east parapet, from March through August. The garden is eight planters, a water dish, and a wind that finds the corner even on still days below. I watched for ten minutes at 11:00 whenever I was home.

The planting was thyme, salvia, lavender, sedum, and one tomato I did not deserve. The tomato put on flowers in June and set nothing. Nights up here run windy enough to knock a blossom before it sticks, and I had no screen. I stopped expecting fruit and left the plant as a leaf machine.

The first bee was a common carder on the thyme, April 2, a single worker that left before the ten minutes were up. Honeybees did not appear until April 19. I walked the block that evening and found the hive: two streets over, in the side yard of Mrs. Adeyemi, who keeps two boxes and a hand-painted sign that says “do not knock.” She told me the flow from street trees was late this year.

Red-tailed bumblebees showed in May and preferred the salvia. They ignored the lavender until it fully opened, then worked it in the last three minutes of almost every watch. I never saw them at the water dish. The honeybees used the dish constantly once I switched from a plastic lid to a terracotta saucer filled each morning.

The peak was July 16: forty-seven bees in the ten-minute watch, most of them honeybees on thyme that had been cut and come back. Sedum opened last, in the middle of August, and on those days the honeybees abandoned the thyme for it. If this roof feeds anyone, it is because the saucer is refreshed daily and something is in flower from April to August. A tomato is optional. Water is not.`,
    },
    {
      id: "lanterns",
      title: "Minutes of the Lantern Committee",
      author: "Jonah Ives, clerk",
      kicker: "Minutes",
      prompts: [
        "How did the vote on oil lanterns go?",
        "What did Brightline quote for electric poles?",
        "When is the next meeting?",
      ],
      body: `East Lantern. Meeting of the harbor-path committee, October 3, 1911, in the reading room above the post office. Chair: Harriet Cole. Present: Cole, Ives, M. Pell, S. Adeyemi, R. Hale, and Constable Abebe. The constable attended without a vote, to speak on the dark stretch by the fish sheds.

Cole opened by reading the remaining budget: one hundred twelve dollars and forty cents, after the September paint bill. M. Pell, of Pell & Sons, offered forty oil lanterns at two dollars and fifteen cents each, brackets included, delivery before October 20. He left the room for the discussion and returned only for the vote, which the chair allowed.

S. Adeyemi presented a letter from Brightline Company quoting eight hundred sixty dollars for eight electric poles along the same path, wire and lamps extra, work to begin “in the spring if the creek cooperates.” Hale called the figure a wish. Abebe said the sheds needed light before the herring-run festival, not after the thaw. Cole reminded the room that spring was not this committee’s money to spend.

The motion to purchase the forty oil lanterns from Pell & Sons carried four to two. Adeyemi and Hale voted no, both asking that at least the school steps wait for a smaller electric trial. Cole assigned two of the forty lanterns to those steps anyway, so the children would not come up in the dark, and the rest to the harbor path. Brackets are to be hung by November 1.

Ives is to write Pell & Sons in the morning and to post a notice that the path will be closed for half a day while the brackets go up. Next meeting: November 7, same room, to inspect the work and to hear whether any lantern has already been borrowed and not returned. Adjourned at nine.`,
    },
  ];

  root.VELLUM_SAMPLES = seeds.map((seed) => ({
    id: seed.id,
    title: seed.title,
    author: seed.author,
    kicker: seed.kicker,
    prompts: seed.prompts,
    paragraphs: paragraphsFromBody(seed.body),
    origin: "sample",
  }));
})(window);
