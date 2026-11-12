"""Seed the database with Soul of Nature categories and sample products.

Run with: python -m app.seed
The script is idempotent: existing rows (matched by slug) are updated in place.
"""

from sqlmodel import Session, select

from app.db.session import engine, init_db
from app.models import Category, Product

CATEGORIES = [
    {
        "name": "Grooming",
        "slug": "grooming",
        "description": "Beard, shave, and hair care crafted from plant-based oils and butters.",
    },
    {
        "name": "Personal Care",
        "slug": "personal-care",
        "description": "Everyday body and skin essentials that keep it clean and natural.",
    },
    {
        "name": "Fragrance",
        "slug": "fragrance",
        "description": "Earthy, woody, and warm signature scents and fragrance oils.",
    },
    {
        "name": "Wellness",
        "slug": "wellness",
        "description": "Herbal teas, aromatherapy, and rituals to restore mind and body.",
    },
]

PRODUCTS = [
    # Grooming
    {
        "category": "grooming",
        "name": "Cedar & Sage Beard Oil",
        "slug": "cedar-sage-beard-oil",
        "price_cents": 2400,
        "size": "1 fl oz",
        "stock": 60,
        "is_featured": True,
        "description": "A lightweight blend that softens coarse hair, tames itch, and leaves a clean cedarwood finish.",
        "ingredients": "Jojoba oil, argan oil, sweet almond oil, cedarwood essential oil, sage essential oil, vitamin E.",
    },
    {
        "category": "grooming",
        "name": "Shea Butter Beard Balm",
        "slug": "shea-butter-beard-balm",
        "price_cents": 2200,
        "size": "2 oz",
        "stock": 45,
        "description": "Medium-hold balm that shapes and conditions while locking in moisture all day.",
        "ingredients": "Raw shea butter, beeswax, mango butter, castor oil, black seed oil, sandalwood essential oil.",
    },
    {
        "category": "grooming",
        "name": "Black Soap Shave Cream",
        "slug": "black-soap-shave-cream",
        "price_cents": 1800,
        "size": "4 oz",
        "stock": 50,
        "description": "Rich lather built on African black soap for a close, bump-free shave.",
        "ingredients": "African black soap, aloe vera, coconut oil, tea tree oil, peppermint oil.",
    },
    {
        "category": "grooming",
        "name": "Soothing Aftershave Tonic",
        "slug": "soothing-aftershave-tonic",
        "price_cents": 1900,
        "size": "4 fl oz",
        "stock": 40,
        "description": "Alcohol-free witch hazel tonic that calms razor burn and closes pores.",
        "ingredients": "Witch hazel, aloe vera, chamomile extract, lavender essential oil, glycerin.",
    },
    {
        "category": "grooming",
        "name": "Curl & Wave Pomade",
        "slug": "curl-wave-pomade",
        "price_cents": 1600,
        "size": "3 oz",
        "stock": 35,
        "description": "Water-based pomade for defined waves and natural shine without the buildup.",
        "ingredients": "Aloe vera, flaxseed gel, coconut oil, shea butter, rosemary extract.",
    },
    # Personal care
    {
        "category": "personal-care",
        "name": "Charcoal & Eucalyptus Body Bar",
        "slug": "charcoal-eucalyptus-body-bar",
        "price_cents": 1000,
        "size": "5 oz",
        "stock": 120,
        "is_featured": True,
        "description": "Cold-processed bar that draws out impurities and wakes up your senses.",
        "ingredients": "Saponified olive, coconut and palm-free oils, activated charcoal, eucalyptus essential oil.",
    },
    {
        "category": "personal-care",
        "name": "Cocoa Butter Body Lotion",
        "slug": "cocoa-butter-body-lotion",
        "price_cents": 2000,
        "size": "8 fl oz",
        "stock": 70,
        "description": "Fast-absorbing lotion that keeps skin smooth and ash-free from morning to night.",
        "ingredients": "Cocoa butter, shea butter, aloe vera, sunflower oil, vitamin E.",
    },
    {
        "category": "personal-care",
        "name": "Natural Deodorant — Vetiver",
        "slug": "natural-deodorant-vetiver",
        "price_cents": 1400,
        "size": "2.5 oz",
        "stock": 80,
        "description": "Aluminum-free protection with a grounding vetiver and citrus scent.",
        "ingredients": "Arrowroot powder, coconut oil, shea butter, magnesium hydroxide, vetiver essential oil.",
    },
    {
        "category": "personal-care",
        "name": "Peppermint Lip Balm",
        "slug": "peppermint-lip-balm",
        "price_cents": 600,
        "size": "0.15 oz",
        "stock": 150,
        "description": "Cooling balm that heals dry, cracked lips with a natural matte finish.",
        "ingredients": "Beeswax, shea butter, coconut oil, peppermint essential oil.",
    },
    # Fragrance
    {
        "category": "fragrance",
        "name": "Roots Eau de Parfum",
        "slug": "roots-eau-de-parfum",
        "price_cents": 6800,
        "size": "50 ml",
        "stock": 25,
        "is_featured": True,
        "description": "Our signature scent: smoked oud, vetiver root, and black pepper over a warm amber base.",
        "ingredients": "Plant-derived alcohol, natural fragrance oils (oud, vetiver, black pepper, amber).",
    },
    {
        "category": "fragrance",
        "name": "Sandalwood Fragrance Oil",
        "slug": "sandalwood-fragrance-oil",
        "price_cents": 3200,
        "size": "10 ml roll-on",
        "stock": 40,
        "description": "Concentrated, alcohol-free roll-on with creamy sandalwood and a touch of vanilla.",
        "ingredients": "Fractionated coconut oil, sandalwood oil, vanilla absolute.",
    },
    {
        "category": "fragrance",
        "name": "Citrus Grove Cologne",
        "slug": "citrus-grove-cologne",
        "price_cents": 5400,
        "size": "100 ml",
        "stock": 30,
        "description": "Bright bergamot and neroli balanced with cedar for an easy daytime scent.",
        "ingredients": "Plant-derived alcohol, bergamot oil, neroli oil, cedarwood oil.",
    },
    # Wellness
    {
        "category": "wellness",
        "name": "Restore Herbal Tea Blend",
        "slug": "restore-herbal-tea-blend",
        "price_cents": 1500,
        "size": "20 sachets",
        "stock": 90,
        "is_featured": True,
        "description": "Caffeine-free blend of hibiscus, ginger, and lemongrass to unwind after a long day.",
        "ingredients": "Hibiscus, ginger root, lemongrass, rooibos, cinnamon.",
    },
    {
        "category": "wellness",
        "name": "Eucalyptus Shower Steamers",
        "slug": "eucalyptus-shower-steamers",
        "price_cents": 1800,
        "size": "6 pack",
        "stock": 55,
        "description": "Drop one in the shower for a spa-level eucalyptus and mint steam.",
        "ingredients": "Baking soda, citric acid, eucalyptus essential oil, menthol crystals.",
    },
    {
        "category": "wellness",
        "name": "Calm Mind Aromatherapy Roller",
        "slug": "calm-mind-aromatherapy-roller",
        "price_cents": 1600,
        "size": "10 ml",
        "stock": 65,
        "description": "Pulse-point roller with lavender, frankincense, and clary sage to ease stress.",
        "ingredients": "Fractionated coconut oil, lavender oil, frankincense oil, clary sage oil.",
    },
    {
        "category": "wellness",
        "name": "Black Seed Oil Wellness Capsules",
        "slug": "black-seed-oil-capsules",
        "price_cents": 2600,
        "size": "60 capsules",
        "stock": 0,
        "description": "Cold-pressed Nigella sativa oil in easy softgels to support daily wellness.",
        "ingredients": "Cold-pressed black seed oil, bovine-free gelatin capsule.",
    },
]


def seed(session: Session) -> None:
    categories: dict[str, Category] = {}
    for data in CATEGORIES:
        category = session.exec(select(Category).where(Category.slug == data["slug"])).first()
        if category is None:
            category = Category(**data)
        else:
            category.sqlmodel_update(data)
        session.add(category)
        categories[data["slug"]] = category
    session.flush()

    for data in PRODUCTS:
        values = {k: v for k, v in data.items() if k != "category"}
        values["category_id"] = categories[data["category"]].id
        product = session.exec(select(Product).where(Product.slug == data["slug"])).first()
        if product is None:
            product = Product(**values)
        else:
            product.sqlmodel_update(values)
        session.add(product)
    session.commit()


def main() -> None:
    init_db()
    with Session(engine) as session:
        seed(session)
    print(f"Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.")


if __name__ == "__main__":
    main()
