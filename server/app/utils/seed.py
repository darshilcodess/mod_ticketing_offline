import sys
import logging
import uuid
import random
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.team import Team
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.document import TicketDocument
from app.models.document_content import (
    VoucherContent, 
    CompletionCertificateContent, 
    OutboundDeliveryContent,
    VoucherVariableQtyContent,
    VoucherWithTitleContent,
    VoucherWithExplanationContent
)
from app.core.security import get_password_hash
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ─── Seed Data ────────────────────────────────────────────────────────────────

TEAMS = [
    {"name": "Infantry",   "description": "Foot soldiers and frontline ground combat operations"},
    {"name": "Artillery",  "description": "Heavy weaponry and long-range fire support"},
    {"name": "Armoured",   "description": "Tank units and mechanized warfare operations"},
    {"name": "Engineers",  "description": "Bridge building, mines, and structural maintenance"},
    {"name": "Signals",    "description": "Communication networks and electronic warfare"},
    {"name": "EME",        "description": "Electrical and Mechanical Engineers for equipment repair"},
    {"name": "ASC",        "description": "Army Service Corps - provisioning rations, transport, and supplies"},
    {"name": "AOC",        "description": "Army Ordnance Corps - ammunition, vehicles, clothing, and equipment"},
    {"name": "AMC",        "description": "Army Medical Corps - medical services and field hospitals"},
]

USERS = [
    # G1 / Administrators
    {"email": "g1.admin@example.com",   "password": "pass123",   "full_name": "Arjun",      "role": UserRole.G1,    "team": None},
    {"email": "g1.ops@example.com",     "password": "pass123",   "full_name": "Vikram",     "role": UserRole.G1,    "team": None},
    # Admin role
    {"email": "superadmin@example.com", "password": "pass123",   "full_name": "Aditya",     "role": UserRole.ADMIN, "team": None},
    # Unit users (raise tickets)
    {"email": "unit.alpha@example.com", "password": "pass123",   "full_name": "Karan",      "role": UserRole.UNIT,  "team": None},
    {"email": "unit.beta@example.com",  "password": "pass123",   "full_name": "Rohan",      "role": UserRole.UNIT,  "team": None},
    {"email": "unit.gamma@example.com", "password": "pass123",   "full_name": "Vijay",      "role": UserRole.UNIT,  "team": None},
    {"email": "unit.delta@example.com", "password": "pass123",   "full_name": "Yash",       "role": UserRole.UNIT,  "team": None},
    # Team workers
    {"email": "eme.worker1@example.com",   "password": "pass123", "full_name": "Rahul",    "role": UserRole.TEAM, "team": "EME"},
    {"email": "eme.worker2@example.com",   "password": "pass123", "full_name": "Amit",     "role": UserRole.TEAM, "team": "EME"},
    {"email": "eng.worker1@example.com",   "password": "pass123", "full_name": "Sanjay",   "role": UserRole.TEAM, "team": "Engineers"},
    {"email": "sig.worker1@example.com",   "password": "pass123", "full_name": "Ajay",     "role": UserRole.TEAM, "team": "Signals"},
    {"email": "asc.worker1@example.com",   "password": "pass123", "full_name": "Ravi",     "role": UserRole.TEAM, "team": "ASC"},
    {"email": "aoc.worker1@example.com",   "password": "pass123", "full_name": "Deepak",   "role": UserRole.TEAM, "team": "AOC"},
    {"email": "amc.worker1@example.com",   "password": "pass123", "full_name": "Pranav",   "role": UserRole.TEAM, "team": "AMC"},
    {"email": "inf.worker1@example.com",   "password": "pass123", "full_name": "Mohit",    "role": UserRole.TEAM, "team": "Infantry"},
]

TICKETS = [
    # EME tickets
    {"title": "T-90 Tank Engine Overhaul", "description": "Routine maintenance and engine calibration required for T-90 Bhishma tank.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.ALLOCATED, "creator_email": "unit.alpha@example.com", "team": "EME"},
    {"title": "Radar System Calibration", "description": "Air defense radar system showing discrepancy in range discovery.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.RESOLVED, "creator_email": "unit.beta@example.com", "team": "EME"},
    {"title": "Bofors Gun Recoil Mechanism Repair", "description": "Recoil mechanism is jammed after recent field firing exercise.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.CLOSED, "creator_email": "unit.gamma@example.com", "team": "EME"},
    {"title": "Drone Battery Bank Servicing", "description": "Surveillance drone battery bank loses charge rapidly, needs inspection.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.OPEN, "creator_email": "unit.delta@example.com", "team": None},
    
    # Engineers tickets
    {"title": "Bailey Bridge Structural Check", "description": "Immediate inspection required for the temporary bridge over Sector 4 river.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.OPEN, "creator_email": "unit.alpha@example.com", "team": None},
    {"title": "Minefield Perimeter Security", "description": "Fence repair needed for the deactivated minefield area in training grounds.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.ALLOCATED, "creator_email": "unit.gamma@example.com", "team": "Engineers"},
    {"title": "Bunker Roof Reinforcement - Sector 9", "description": "Minor cave-in observed in advance command bunker in Sector 9.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.RESOLVED, "creator_email": "unit.beta@example.com", "team": "Engineers"},
    {"title": "Water Purification Unit Setup", "description": "Install and test new water purification unit for forward base alpha.",
     "priority": TicketPriority.LOW, "status": TicketStatus.CLOSED, "creator_email": "unit.delta@example.com", "team": "Engineers"},

    # Signals tickets
    {"title": "Secure Line Fault in Bunker 2", "description": "The encrypted communication line in command bunker 2 is intermittently failing.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.CLOSED, "creator_email": "unit.beta@example.com", "team": "Signals"},
    {"title": "Satellite Link Latency Issue", "description": "High latency observed in satellite data transmission for field units.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.OPEN, "creator_email": "unit.alpha@example.com", "team": None},
    {"title": "Radio Interference - Sector 7", "description": "Unknown radio interference blocking local tactical communications.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.ALLOCATED, "creator_email": "unit.gamma@example.com", "team": "Signals"},
    {"title": "Crypto Key Refresh", "description": "Routine weekly cryptographic key refresh across all handheld radios.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.RESOLVED, "creator_email": "unit.delta@example.com", "team": "Signals"},

    # ASC (Service Corps) tickets
    {"title": "Winter Rations Indent - Forward Posts", "description": "Indent for special high-altitude rations for 5 forward posts.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.ALLOCATED, "creator_email": "unit.alpha@example.com", "team": "ASC"},
    {"title": "Supply Convoy Scheduling", "description": "Schedule the weekly supply convoy route considering recent snowfall.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.CLOSED, "creator_email": "unit.beta@example.com", "team": "ASC"},
    {"title": "Transport Vehicle Brake Failure", "description": "Brake failure reported in 3-ton transport truck DL-1234.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.OPEN, "creator_email": "unit.gamma@example.com", "team": None},
    {"title": "Fuel Depot Audit request", "description": "Monthly audit of fuel reserves at base camp depot.",
     "priority": TicketPriority.LOW, "status": TicketStatus.RESOLVED, "creator_email": "unit.delta@example.com", "team": "ASC"},

    # AOC (Ordnance Corps) tickets
    {"title": "5.56mm Ammunition Restock", "description": "Restock request for 5.56mm INSAS rifle ammunition ahead of training.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.OPEN, "creator_email": "unit.alpha@example.com", "team": None},
    {"title": "Extreme Cold Weather Clothing Issue", "description": "Issue of ECWCS clothing to newly arriving platoon at high altitude.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.ALLOCATED, "creator_email": "unit.beta@example.com", "team": "AOC"},
    {"title": "Night Vision Goggles Repair", "description": "Return of 5 defective NVG units from border patrol for repair/replacement.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.CLOSED, "creator_email": "unit.gamma@example.com", "team": "AOC"},
    {"title": "Armoury Audit Verification", "description": "Cross-check physical inventory with digital records for main armoury.",
     "priority": TicketPriority.LOW, "status": TicketStatus.ALLOCATED, "creator_email": "unit.delta@example.com", "team": "AOC"},

    # AMC (Medical Corps) tickets
    {"title": "Field Trauma Kit Replenishment", "description": "Replenish tourniquets and coagulants in 20 standard field trauma kits.",
     "priority": TicketPriority.HIGH, "status": TicketStatus.ALLOCATED, "creator_email": "unit.alpha@example.com", "team": "AMC"},
    {"title": "Ambulance Oxygen Cylinder Refill", "description": "Oxygen cylinders in base ambulance are below 20% capacity.",
     "priority": TicketPriority.CRITICAL, "status": TicketStatus.OPEN, "creator_email": "unit.beta@example.com", "team": None},
    {"title": "Defibrillator Calibration", "description": "Annual calibration check for main hospital wing defibrillators.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.RESOLVED, "creator_email": "unit.gamma@example.com", "team": "AMC"},
    {"title": "Evacuation Protocol Review", "description": "Review and update aero-medical evacuation protocol documentation.",
     "priority": TicketPriority.LOW, "status": TicketStatus.CLOSED, "creator_email": "unit.delta@example.com", "team": "AMC"},
     
    # Infantry tickets
    {"title": "Weapon Cleaning Kits Requirement", "description": "Shortage of caliber-specific cleaning kits for the new rifle induction.",
     "priority": TicketPriority.MEDIUM, "status": TicketStatus.ALLOCATED, "creator_email": "unit.alpha@example.com", "team": "Infantry"},
     {"title": "Target Range Maintenance", "description": "Replace worn out target boards and repair backstop berm at firing range.",
     "priority": TicketPriority.LOW, "status": TicketStatus.OPEN, "creator_email": "unit.alpha@example.com", "team": None},
]


# ─── Validation ───────────────────────────────────────────────────────────────

def has_existing_data(db) -> bool:
    """Return True if the database already contains dummy seed data."""
    user_count = db.query(User).count()
    team_count = db.query(Team).count()
    ticket_count = db.query(Ticket).count()

    # If any users exist besides a possible default admin, we consider it seeded
    if user_count > 1 or team_count > 0 or ticket_count > 0:
        logger.info(
            f"⚠️  Existing data detected: {user_count} users, "
            f"{team_count} teams, {ticket_count} tickets."
        )
        return True
    return False


# ─── Seed Function ────────────────────────────────────────────────────────────

def seed_db(force: bool = False):
    db = SessionLocal()
    try:
        # ── Guard: skip if data already exists ───────────────────────────────
        if has_existing_data(db) and not force:
            logger.info("✅ Database already seeded. Use --force to re-seed.")
            return

        if force:
            logger.info("🔄 --force flag set: skipping existing records (not deleting).")

        # ── Teams ─────────────────────────────────────────────────────────────
        team_map: dict[str, Team] = {}
        for t in TEAMS:
            existing = db.query(Team).filter(Team.name == t["name"]).first()
            if not existing:
                obj = Team(name=t["name"], description=t["description"])
                db.add(obj)
                db.flush()
                team_map[t["name"]] = obj
                logger.info(f"  ➕ Team: {t['name']}")
            else:
                team_map[t["name"]] = existing
                logger.info(f"  ⏭️  Team already exists: {t['name']}")
        db.commit()

        # ── Users ─────────────────────────────────────────────────────────────
        user_map: dict[str, User] = {}
        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                team_obj = team_map.get(u["team"]) if u["team"] else None
                obj = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    team_id=team_obj.id if team_obj else None,
                    is_active=True,
                )
                db.add(obj)
                db.flush()
                user_map[u["email"]] = obj
                logger.info(f"  ➕ User: {u['email']}  [{u['role'].value}]")
            else:
                user_map[u["email"]] = existing
                logger.info(f"  ⏭️  User already exists: {u['email']}")
        db.commit()

        # ── Tickets and Documents ────────────────────────────────────────────
        for tk in TICKETS:
            existing = db.query(Ticket).filter(Ticket.title == tk["title"]).first()
            if not existing:
                creator = user_map.get(tk["creator_email"])
                assigned_team = team_map.get(tk["team"]) if tk["team"] else None
                
                # Assign a resolver if resolved or closed
                resolver = None
                if tk["status"] in [TicketStatus.RESOLVED, TicketStatus.CLOSED] and tk["team"]:
                    # Find a worker from that team
                    resolver = db.query(User).filter(User.team_id == assigned_team.id).first()

                obj = Ticket(
                    title=tk["title"],
                    description=tk["description"],
                    priority=tk["priority"],
                    status=tk["status"],
                    created_by_id=creator.id if creator else None,
                    assigned_team_id=assigned_team.id if assigned_team else None,
                    resolved_by_id=resolver.id if resolver else None,
                    resolution_notes=f"Completed task: {tk['title']} as per standard operating procedure." if tk["status"] in [TicketStatus.RESOLVED, TicketStatus.CLOSED] else None
                )
                db.add(obj)
                db.flush() # Get ticket id
                
                # Document Seeding Logic
                if tk["status"] in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
                    # Always create completion certificate for resolved/closed
                    file_id = f"seed_{uuid.uuid4().hex[:8]}"
                    doc = TicketDocument(
                        ticket_id=obj.id,
                        file_id=file_id,
                        template_name="issue_completion.html",
                        document_type="completion_certificate"
                    )
                    db.add(doc)
                    db.flush()
                    
                    content = CompletionCertificateContent(
                        ticket_id=obj.id,
                        document_id=doc.id,
                        data={
                            "ticket_title": obj.title,
                            "resolver": resolver.full_name if resolver else "Admin",
                            "completion_date": "2024-03-20",
                            "notes": obj.resolution_notes
                        }
                    )
                    db.add(content)
                    logger.info(f"  ➕ Ticket & Document (Certificate): {tk['title'][:50]}")
                
                elif tk["status"] in [TicketStatus.OPEN, TicketStatus.ALLOCATED]:
                    # Randomly create various vouchers for open/allocated tickets (75% chance)
                    if random.random() < 0.75:
                        doc_types = [
                             ("voucher.html", VoucherContent, {"recipient": "Depot HQ", "items": [{"name": "Standard supplies", "quantity": 10}], "document_type": "voucher"}),
                            ("outbound_delivery.html", OutboundDeliveryContent, {"address": "Forward Base", "packages": 5, "weight": "250kg"}, "outbound_delivery"),
                            ("voucher_with_variable_qty.html", VoucherVariableQtyContent, {"items": [{"name": "MREs", "min_qty": 100, "max_qty": 500}], "document_type": "voucher_variable_qty"}),
                            ("voucher_with_title.html", VoucherWithTitleContent, {"documentTitle": "Requisition Intent", "details": "Initial request logged.", "document_type": "voucher_title"}),
                            ("voucher_with_explanation.html", VoucherWithExplanationContent, {"explanation": "Urgent requirement due to severe weather disrupting standard supply lines.", "document_type": "voucher_explanation"}),
                        ]
                        
                        # Pick a random document type
                        template_name, ModelClass, dummy_data, *_ = random.choice(doc_types)
                        
                        doc_type_key = dummy_data.pop("document_type") if "document_type" in dummy_data else template_name.replace(".html", "")
                        if doc_type_key == "outbound_delivery.html": # special case for how I unpacked it above
                             doc_type_key = "outbound_delivery"

                        file_id = f"seed_v_{uuid.uuid4().hex[:8]}"
                        doc = TicketDocument(
                            ticket_id=obj.id,
                            file_id=file_id,
                            template_name=template_name,
                            document_type=doc_type_key
                        )
                        db.add(doc)
                        db.flush()
                        
                        # Add common data
                        dummy_data["ticket_ref"] = f"TKT-{obj.id}"
                        dummy_data["status_note"] = "Pending Processing"
                        
                        content = ModelClass(
                            ticket_id=obj.id,
                            document_id=doc.id,
                            data=dummy_data
                        )
                        db.add(content)
                        logger.info(f"  ➕ Ticket & Document ({template_name}): {tk['title'][:50]}")
                    else:
                        logger.info(f"  ➕ Ticket: {tk['title'][:50]}")
            else:
                logger.info(f"  ⏭️  Ticket already exists: {tk['title'][:50]}")
        db.commit()

        logger.info("\n✅ Database seeded successfully with expanded Indian Army data!")
        logger.info(f"   Teams: {len(TEAMS)} | Users: {len(USERS)} | Tickets: {len(TICKETS)}")

    except Exception as e:
        import traceback
        db.rollback()
        logger.error(f"❌ Seed failed: {e}")
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    force = "--force" in sys.argv
    seed_db(force=force)
