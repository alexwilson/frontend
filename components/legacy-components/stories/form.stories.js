import { Form, Input, InlineGroup, TextArea, Submit } from '../src/form';

export default {
  title: 'Legacy/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () =>
    <Form action="#" target="_self">
      <Input type="text" name="name" placeholder="Name" />
      <Input type="text" name="phone" placeholder="Phone" />
      <Input type="text" name="email" placeholder="Email" />
      <TextArea name="message" placeholder="How can I help?" />
      <Submit />
    </Form>
};

export const Inline = {
  render: () =>
    <Form action="#" target="_self">
      <InlineGroup>
        <Input type="text" name="phone" placeholder="Phone" />
        <Submit />
      </InlineGroup>
    </Form>
}
