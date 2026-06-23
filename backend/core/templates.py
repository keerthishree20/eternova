LETTER_TEMPLATES = {
    "love-letter": {
        "id": "love-letter",
        "name": "Love Letter",
        "category": "romantic",
        "description": "Express your deepest feelings to someone special",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Sarah"},
            {"key": "quality1", "label": "What you love about them", "placeholder": "e.g., your smile"},
            {"key": "quality2", "label": "Another thing you adore", "placeholder": "e.g., your kindness"},
            {"key": "memory", "label": "A special memory together", "placeholder": "e.g., that evening walk by the lake"},
            {"key": "feeling", "label": "How they make you feel", "placeholder": "e.g., like the luckiest person alive"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """My Dearest {recipient},

There are moments when words feel too small to hold everything I feel for you, but I want to try.

From the very first time I noticed {quality1}, I knew there was something extraordinary about you. And as I got to know you better, {quality2} only made me fall deeper.

I keep going back to {memory} — that moment lives in my heart like a favorite song I never want to stop playing.

Every day with you, I feel {feeling}. You have changed my world in ways I never imagined possible.

I don't know what the future holds, but I know I want you in it — today, tomorrow, and every day after.

With all my love,
{sender}""",
    },
    "appreciation": {
        "id": "appreciation",
        "name": "Appreciation Letter",
        "category": "gratitude",
        "description": "Thank someone for being in your life",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Mom"},
            {"key": "thing_they_did", "label": "Something they did for you", "placeholder": "e.g., always believed in me"},
            {"key": "impact", "label": "How it impacted you", "placeholder": "e.g., gave me courage to chase my dreams"},
            {"key": "quality", "label": "A quality you admire in them", "placeholder": "e.g., your unwavering patience"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """Dear {recipient},

I've been meaning to tell you something important, and I don't want another day to pass without saying it.

Thank you. Thank you for the way you {thing_they_did}. It may have seemed small to you, but it {impact} — and that changed everything for me.

I admire {quality} more than you know. In a world that moves so fast, you remind me of what truly matters.

You are a gift in my life, and I never want to take that for granted.

With deep gratitude,
{sender}""",
    },
    "missing-you": {
        "id": "missing-you",
        "name": "Missing You",
        "category": "longing",
        "description": "Tell someone how much you miss them",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Jamie"},
            {"key": "thing_you_miss", "label": "What you miss most", "placeholder": "e.g., your laugh echoing through the room"},
            {"key": "memory", "label": "A memory you keep replaying", "placeholder": "e.g., our late-night talks about everything and nothing"},
            {"key": "wish", "label": "What you wish you could do right now", "placeholder": "e.g., sit next to you in comfortable silence"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """Dear {recipient},

Distance has a way of making the heart speak louder. And right now, mine is saying your name.

I miss {thing_you_miss}. It's the little things that hit the hardest, isn't it?

I keep thinking about {memory}. Those moments felt so ordinary at the time, but now I realize they were everything.

If I could do one thing right now, I would {wish}. Just that. Nothing more, nothing less.

Until we meet again, know that you are missed more than words can say.

Thinking of you always,
{sender}""",
    },
    "anniversary": {
        "id": "anniversary",
        "name": "Anniversary Letter",
        "category": "celebration",
        "description": "Celebrate a special anniversary milestone",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Love"},
            {"key": "years", "label": "How many years/months", "placeholder": "e.g., 3 beautiful years"},
            {"key": "best_moment", "label": "The best moment together", "placeholder": "e.g., dancing in the rain that one summer night"},
            {"key": "growth", "label": "How you've grown together", "placeholder": "e.g., learned to be patient, to listen, to love without conditions"},
            {"key": "future", "label": "What you look forward to", "placeholder": "e.g., building a home filled with laughter"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """My Dearest {recipient},

Happy anniversary. {years} — can you believe it?

I look back at everything we've shared, and my favorite moment is still {best_moment}. That's the moment I knew this was something rare.

Together, we've {growth}. We're not the same people we were when we started, and I think that's beautiful. We've grown — not apart, but deeper into each other.

When I think about the future, I see us {future}. And that thought fills me with more joy than I can express.

Here's to us — to every chapter we've written and every page yet to come.

Forever yours,
{sender}""",
    },
    "apology": {
        "id": "apology",
        "name": "Apology Letter",
        "category": "healing",
        "description": "Sincerely apologize and mend a relationship",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Sam"},
            {"key": "what_happened", "label": "What you're sorry for", "placeholder": "e.g., not being there when you needed me most"},
            {"key": "understanding", "label": "How you think they felt", "placeholder": "e.g., alone and let down"},
            {"key": "commitment", "label": "What you'll do differently", "placeholder": "e.g., show up, not just in words but in action"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """Dear {recipient},

I've been carrying this weight, and I need to put it into words.

I'm sorry for {what_happened}. There's no excuse that makes it okay, and I'm not here to offer one.

I can only imagine you felt {understanding}, and knowing I caused that pain is something I'll always regret.

What I can promise is this: I will {commitment}. Not because I expect forgiveness, but because you deserve better — and I want to be better.

You matter to me. More than my pride, more than being right. I hope you'll give me the chance to prove that.

With a humble heart,
{sender}""",
    },
    "congratulations": {
        "id": "congratulations",
        "name": "Congratulations Letter",
        "category": "celebration",
        "description": "Celebrate someone's achievement or milestone",
        "fields": [
            {"key": "recipient", "label": "Their Name", "placeholder": "e.g., Priya"},
            {"key": "achievement", "label": "What they achieved", "placeholder": "e.g., getting into your dream university"},
            {"key": "quality", "label": "The quality that got them there", "placeholder": "e.g., your relentless determination"},
            {"key": "memory", "label": "A moment you saw them work for it", "placeholder": "e.g., those late nights studying while everyone else was out"},
            {"key": "sender", "label": "Your Name", "placeholder": "e.g., Alex"},
        ],
        "body": """Dear {recipient},

I just heard the news, and I couldn't be more proud.

Congratulations on {achievement}! This isn't luck — this is the result of {quality}, and everyone who knows you can see that.

I remember {memory}. That's the person who earned this. That's you.

This is just the beginning. The world has no idea what's coming, but I do — and I can't wait to watch you shine.

Cheering you on, always,
{sender}""",
    },
}


def get_all_templates() -> list:
    return [
        {"id": t["id"], "name": t["name"], "category": t["category"], "description": t["description"]}
        for t in LETTER_TEMPLATES.values()
    ]


def get_template(template_id: str) -> dict | None:
    return LETTER_TEMPLATES.get(template_id)


def fill_template(template_id: str, fields: dict) -> str | None:
    template = LETTER_TEMPLATES.get(template_id)
    if not template:
        return None
    try:
        return template["body"].format(**fields)
    except KeyError:
        return None
