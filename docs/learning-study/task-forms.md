# Participant task forms

The facilitator supplies one form at a time. Use JavaScript or plain language.
Spend up to 20 active minutes. Say when you are unsure. Record help used and
minutes spent; assistance is useful context, not something to hide.

## Form A: before the course

1. A JavaScript program changes its weights after comparing predictions with
   labeled past builds. Another loads frozen weights and scores one new
   build. Which is training, which is inference, and what changes in each?
2. You must flag a build when it starts. The dataset contains changed-file
   count and final execution duration. Which input is available then? Where
   would you fit a scaler when evaluating on later builds, and why?
3. On the same validation builds, policy A has 6 false positives and 2 false
   negatives; B has 2 false positives and 5 false negatives. A false positive
   costs 2 minutes and a false negative costs 8. Compute both costs and choose
   a policy for this decision. Is accuracy alone enough to choose?
4. The classifier outputs 0.93 for one build. What does this tell you, and
   what would you check before calling it a reliable 93% failure probability?
5. False positives now cost 8 minutes; missed failures still cost 8. Write
   a small JavaScript cost function, recompute both policies and choose again.
   Which data should drive this change, and what if you already used your
   final test results to choose it?

## Form B: immediately after the course

1. One program loads saved room-classifier weights and predicts occupancy.
   Another computes errors against labeled readings and updates the weights.
   Name the two operations and explain which changes the fitted model.
2. A room detector must decide at noon from current sensors. Candidate inputs
   include noon light and whether the room was occupied at 12:10. Explain
   your input choice and how to handle scaling when testing on a later week.
3. On identical validation readings, A has 8 false positives and 1 false
   negative; B has 2 false positives and 4 false negatives. Costs are 1 for
   a false positive and 5 for a missed occupant. Compute both costs, choose
   a policy and explain why accuracy alone may hide the tradeoff.
4. The room model outputs 0.88. Explain why this is not a guarantee about
   this reading and describe evidence needed to interpret it as a probability.
5. Unnecessary heating raises false-positive cost to 4; false-negative cost
   stays 5. Implement the cost calculation, choose again and explain how to
   evaluate the revised choice without reusing a test set for selection.

## Form C: seven-day check

1. A stock-alert program loads weights and scores a new item. A separate job
   adjusts weights using labeled past items. Name the operations and describe
   what each does to the fitted parameters.
2. At order time, an alert predicts late delivery. You have current backlog
   and actual arrival time recorded days later. Choose a usable input and
   explain where scaling is fitted when evaluating on subsequent orders.
3. On the same validation orders, A has 4 false positives and 2 false
   negatives; B has 1 false positive and 5 false negatives. Costs are 3 for
   a false positive and 4 for a miss. Compute both costs and justify a policy
   without relying only on accuracy.
4. The model outputs 0.81 for one item. Explain what this score does not
   establish and how you would check whether scores like it match outcome rates.
5. False-positive cost rises to 6; misses still cost 4. Implement the cost
   function and choose again. Explain how validation and fresh final evidence
   apply if you already examined test results while making this change.

## Observed course tasks: use during the relevant session

The facilitator supplies only the prompt for the activity being observed.
These observations are separate from the five-task scores above. Keep the
first response and record help before continuing.

1. Start from the Deep Orbit overview using the route that suits your current
   ML knowledge. Reach the packet-layout experiment. Predict a result, inspect
   the two operations and try the changed packet. Explain which operation
   rearranges the channel values and how you checked. Point out anything that
   made the first useful result hard to reach.
2. At normalization, predict the value before revealing it. Use the controls
   and explain which statistics belong to fitting and which belong to applying
   the transform. Try the changed case and explain any changed result.
3. At threshold selection, choose a policy using the displayed validation
   evidence and costs. Explain the choice before seeing the held-out result.
   Afterward, explain what that result permits you to conclude and what further
   evidence you would need before revising the policy.
4. At one later experiment selected before the session, predict what a control
   will change. Inspect the result and explain it using the calculation or
   table. Try the changed case. Name a limit of this example that would matter
   in an application outside the course.
5. At a story decision, explain the evidence and cost of the options before
   choosing. In the later scene, identify what the choice changed. If you
   skipped the decision, say so. At the ending, describe what each central
   character wanted, where their behavior changed, and what remains unknown.
6. After finishing Deep Orbit, open the Neon sample from the dashboard.
   Explain what this task adds to the skills you already used. Predict a filter
   response and try a changed image. Describe what the response does and does
   not establish about the image.

Record interruptions, active minutes, references and hints used. Explain
uncertainty in your own words; there is no need to agree with a character or
say that you enjoyed a scene.
