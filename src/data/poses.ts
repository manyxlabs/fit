export type Pose = { name: string; cue: string; /** Held once on each side. */ sides?: true };

/** Yoga and stretching holds, each with the cue that makes it safe and effective. */
export const POSES = {
  childsPose: { name: "Child's pose", cue: 'Kneel with the big toes touching and the knees apart, sit the hips back towards the heels, and rest the forehead down with the arms forward. A cushion under the hips helps if they do not reach.' },
  catCow: { name: 'Cat-cow', cue: 'On all fours, breathe in as the belly drops and the chest lifts, breathe out as you round the back and tuck the chin. Move slowly with the breath.' },
  downDog: { name: 'Downward-facing dog', cue: 'From all fours, tuck the toes and lift the hips up and back. Press the floor away, hands shoulder-width, and bend the knees as much as you need to keep the spine long. The heels need not touch.' },
  puppy: { name: 'Puppy pose', cue: 'From all fours, walk the hands forward and lower the chest towards the floor, hips staying over the knees. Rest the forehead down and let the armpits sink.' },
  threadNeedle: { name: 'Thread the needle', sides: true, cue: 'From all fours, slide one arm under the other, palm up, until that shoulder and the side of the head rest on the floor. Keep the hips over the knees.' },
  sphinx: { name: 'Sphinx', cue: 'Lie on your front with the elbows under the shoulders and the forearms parallel. Press the forearms down to lift the chest, shoulders away from the ears, legs and glutes relaxed.' },
  lowLunge: { name: 'Low lunge', sides: true, cue: 'Step one foot forward, front knee over the ankle, back knee down on a folded mat. Tuck the tailbone slightly and shift the hips forward until the front of the back hip stretches.' },
  halfSplit: { name: 'Half split', sides: true, cue: 'From the low lunge, shift the hips back over the back knee and straighten the front leg, toes up. Hands on the floor or on blocks, fold forward from the hips with a long spine.' },
  figureFour: { name: 'Reclined figure four', sides: true, cue: 'Lie on your back, cross one ankle over the opposite knee and flex that foot, then draw the bottom thigh towards the chest until the outer hip stretches. A knee-friendly pigeon.' },
  butterfly: { name: 'Butterfly', cue: 'Sit tall with the soles of the feet together and the knees falling out. Sit on a folded blanket if the back rounds, and hinge forward from the hips only as far as the back stays long.' },
  forwardFold: { name: 'Seated forward fold', cue: 'Sit with the legs straight in front, knees soft or bent. Hinge forward from the hips with a long spine and hold the shins or feet without pulling yourself down.' },
  supineTwist: { name: 'Supine twist', sides: true, cue: 'Lie on your back, bring the knees to the chest and lower them to one side, arms out wide. Let the opposite shoulder stay heavy on the floor.' },
  bridgePose: { name: 'Bridge pose', cue: 'Lie on your back with the knees bent and the feet hip-width, close to the hips. Press the feet down to lift the hips, knees pointing forward, chin away from the chest.' },
  happyBaby: { name: 'Happy baby', cue: 'Lie on your back, bring the knees towards the armpits and hold the outer feet or the backs of the thighs, soles to the ceiling. Let the lower back rest on the floor.' },
  legsUpWall: { name: 'Legs up the wall', cue: 'Lie on your back with the hips close to a wall and the legs resting up it, arms by your sides. Breathe slowly.' },
  chair: { name: 'Chair pose', cue: 'Feet hip-width, bend the knees and sit the hips back as if into a chair, weight in the heels. Reach the arms up beside the ears, ribs down.' },
  warrior2: { name: 'Warrior II', sides: true, cue: 'Feet wide, front foot pointing forward, back foot turned in slightly. Bend the front knee over the ankle, arms out at shoulder height, and look over the front hand.' },
  tree: { name: 'Tree pose', sides: true, cue: 'Stand on one leg and place the other foot on the inner ankle, calf or thigh, never on the knee. Hands at the chest, eyes on a fixed point, a wall within reach.' },
  quadStretch: { name: 'Standing quad stretch', sides: true, cue: 'Hold a wall, bend one knee and hold that ankle behind you. Keep the knees side by side and tuck the tailbone slightly until the front of the thigh stretches.' },
  wideFold: { name: 'Wide-legged forward fold', cue: 'Stand with the feet wide and parallel. Hinge forward from the hips with a long spine and rest the hands on the floor or blocks, knees bent if needed.' },
  calfStretch: { name: 'Wall calf stretch', sides: true, cue: 'Hands on a wall, one foot stepped back with the heel down and the knee straight. Lean in until the calf of the back leg stretches.' },
  chairHamstring: { name: 'Seated hamstring stretch', sides: true, cue: 'Sit on the front of a firm chair with one leg straight, heel down, toes up. Hinge forward from the hips with a long back until the back of the thigh stretches.' },
  doorwayChest: { name: 'Doorway chest stretch', cue: 'Forearms on the door frame at shoulder height, elbows under the hands. Step one foot through until the chest stretches, ribs down.' },
  savasana: { name: 'Final rest', cue: 'Lie on your back with the arms and legs relaxed, palms up. Close the eyes and let the breath be natural.' },
} satisfies Record<string, Pose>;
export type PoseId = keyof typeof POSES;
